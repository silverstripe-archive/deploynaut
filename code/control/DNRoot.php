<?php

class DNRoot extends Controller implements PermissionProvider, TemplateGlobalProvider {

	/**
	 *
	 * @var array
	 */
	public static $allowed_actions = array(
		'projects',
		'update',
		'project',
		'environment',
		'metrics',
		'getDeployForm',
		'deploy',
		'deploylog',
		'getDataTransferForm',
		'transfer',
		'transferlog',
		'snapshots',
		'createsnapshot',
		'snapshotslog',
		'uploadsnapshot',
		'getUploadSnapshotForm',
		'getPostSnapshotForm',
		'getDataTransferRestoreForm',
		'restoresnapshot',
		'postsnapshotsuccess',
	);

	/**
	 * URL handlers pretending that we have a deep URL structure.
	 */
	public static $url_handlers = array(
		'project/$Project/environment/$Environment/DeployForm' => 'getDeployForm',
		'project/$Project/createsnapshot/DataTransferForm' => 'getDataTransferForm',
		'project/$Project/DataTransferForm' => 'getDataTransferForm',
		'project/$Project/DataTransferRestoreForm' => 'getDataTransferRestoreForm',
		'project/$Project/UploadSnapshotForm' => 'getUploadSnapshotForm',
		'project/$Project/PostSnapshotForm' => 'getPostSnapshotForm',
		'project/$Project/environment/$Environment/metrics' => 'metrics',
		'project/$Project/environment/$Environment/deploy/$Identifier/log' => 'deploylog',
		'project/$Project/environment/$Environment/deploy/$Identifier' => 'deploy',
		'project/$Project/transfer/$Identifier/log' => 'transferlog',
		'project/$Project/transfer/$Identifier' => 'transfer',
		'project/$Project/environment/$Environment' => 'environment',
		'project/$Project/build/$Build' => 'build',
		'project/$Project/restoresnapshot/$DataArchiveID' => 'restoresnapshot',
		'project/$Project/update' => 'update',
		'project/$Project/snapshots' => 'snapshots',
		'project/$Project/createsnapshot' => 'createsnapshot',
		'project/$Project/uploadsnapshot' => 'uploadsnapshot',
		'project/$Project/snapshotslog' => 'snapshotslog',
		'project/$Project/postsnapshotsuccess/$DataArchiveID' => 'postsnapshotsuccess',
		'project/$Project' => 'project',
		'projects' => 'projects',
	);

	/**
	 *
	 * @var DNData
	 */
	protected $data;

	/**
	 *
	 */
	public function init() {
		parent::init();

		if(!Permission::check('DEPLOYNAUT_ACCESS')) {
			return Security::permissionFailure();
		}

		parent::init();
		Requirements::combine_files(
			'deploynaut.js',
			array(
				THIRDPARTY_DIR . '/jquery/jquery.js',
				'deploynaut/javascript/bootstrap.js',
				'deploynaut/javascript/deploynaut.js',
				'deploynaut/javascript/bootstrap.file-input.js',

			)
		);

		Requirements::css(FRAMEWORK_ADMIN_DIR .'/thirdparty/chosen/chosen/chosen.css');
	}

	/**
	 *
	 * @return string
	 */
	public function Link() {
		return "naut/";
	}

	/**
	 * Actions
	 * 
	 * @return \SS_HTTPResponse
	 */
	public function index(SS_HTTPRequest $request) {
		return $this->redirect($this->Link() . 'projects/');
	}

	/**
	 * Action
	 * 
	 * @return string - HTML
	 */
	public function projects(SS_HTTPRequest $request) {
		return $this->customise(array(
			'Title' => 'Projects',
			'CurrentProject' => $this->getCurrentProject(),
		))->renderWith(array('DNRoot_projects', 'DNRoot'));
	}

	/**
	 * Action
	 * 
	 * @return string - HTML
	 */
	public function snapshots(SS_HTTPRequest $request) {
		// Performs permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return new SS_HTTPResponse("Project '" . $request->latestParam('Project') . "' not found.", 404);
		}
		return $this->customise(array(
			'Title' => 'Data Snapshots',
			'Project' => $project,
			'CurrentProject' => $project,
			'SnapshotsSection' => 1,
		))->renderWith(array('DNRoot_snapshots', 'DNRoot'));
	}

	/**
	 * Action
	 * 
	 * @return string - HTML
	 */
	public function createsnapshot(SS_HTTPRequest $request) {
		// Performs permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return new SS_HTTPResponse("Project '" . $request->latestParam('Project') . "' not found.", 404);
		}

		if(!$project->canBackup()) {
			return new SS_HTTPResponse("Not allowed to create snapshots on any environments", 401);
		}

		return $this->customise(array(
			'Title' => 'Create Data Snapshot',
			'Project' => $project,
			'CurrentProject' => $project,
			'SnapshotsSection' => 1,
			'DataTransferForm' => $this->getDataTransferForm($request)
		))->renderWith(array('DNRoot_createsnapshot', 'DNRoot'));
	}

	/**
	 * Action
	 * 
	 * @return string - HTML
	 */
	public function uploadsnapshot(SS_HTTPRequest $request) {
		// Performs permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return new SS_HTTPResponse("Project '" . $request->latestParam('Project') . "' not found.", 404);
		}

		if(!$project->canUploadArchive()) {
			return new SS_HTTPResponse("Not allowed to upload", 401);	
		}

		return $this->customise(array(
			'Project' => $project,
			'CurrentProject' => $project,
			'SnapshotsSection' => 1,
			'UploadLimit' => $maxSize = File::format_size(min(
				File::ini2bytes(ini_get('upload_max_filesize')), 
				File::ini2bytes(ini_get('post_max_size'))
			)),
			'UploadSnapshotForm' => $this->getUploadSnapshotForm($request),
			'PostSnapshotForm' => $this->getPostSnapshotForm($request)
		))->renderWith(array('DNRoot_uploadsnapshot', 'DNRoot'));
	}

	/**
	 * Construct the upload form.
	 * 
	 * @param SS_HTTPRequest $request
	 * @return Form
	 */
	public function getUploadSnapshotForm(SS_HTTPRequest $request) {
		// Performs permission check by limiting visible projects
		$project = $this->getCurrentProject();

		// Framing an environment as a "group of people with download access"
		// makes more sense to the user here, while still allowing us to enforce
		// environment specific restrictions on downloading the file later on.
		$envs = $project->DNEnvironmentList()->filterByCallback(function($item) {return $item->canUploadArchive();});
		$envsMap = array();
		foreach($envs as $env) {
			$downloaders = implode(', ', $env->ArchiveDownloaders()->column('FirstName'));
			$envsMap[$env->ID] = sprintf(
				'%s (%s)',
				implode(', ', array_map(function($member) {return $member->Name;}, $env->ArchiveDownloaders()->toArray())),
				$env->Name
			);
		}

		$maxSize = min(File::ini2bytes(ini_get('upload_max_filesize')), File::ini2bytes(ini_get('post_max_size')));
		$fileField = DataArchiveFileField::create('ArchiveFile', 'File');
		$fileField->getValidator()->setAllowedExtensions(array('sspak'));
		$fileField->getValidator()->setAllowedMaxFileSize(array('*' => $maxSize));

		$form = new Form(
			$this, 
			'UploadSnapshotForm', 
			new FieldList(
				$fileField,
				DropdownField::create('Mode', 'What does this file contain?', DNDataArchive::get_mode_map()),
				DropdownField::create('EnvironmentID', 'Choose who can download this file', $envsMap)
			), 
			new FieldList(
				$action = new FormAction('doUploadSnapshot', "Upload File")
			),
			new RequiredFields('ArchiveFile')
		);
		$action->addExtraClass('btn');
		$form->disableSecurityToken();
		$form->addExtraClass('fields-wide');
		// Tweak the action so it plays well with our fake URL structure.
		$form->setFormAction($project->Link().'/UploadSnapshotForm');

		return $form;
	}

	public function doUploadSnapshot($data, $form) {
		$project = $this->getCurrentProject();
		if(!$project) {
			return new SS_HTTPResponse("Project '" . $request->latestParam('Project') . "' not found.", 404);
		}

		$validEnvs = $project->DNEnvironmentList()
			->filterByCallback(function($item) {return $item->canUploadArchive();});
		$environment = $validEnvs->find('ID', $data['EnvironmentID']);
		if(!$environment) {
			throw new LogicException('Invalid environment');
		}
		$dataArchive = new DNDataArchive(array(
			'AuthorID' => Member::currentUserID(),
			'EnvironmentID' => $data['EnvironmentID'],
			'IsManualUpload' => true,
		));
		// needs an ID and transfer to determine upload path
		$dataArchive->write(); 
		$dataTransfer = new DNDataTransfer(array(
			'AuthorID' => Member::currentUserID(),
			'Mode' => $data['Mode'],
			'Origin' => 'ManualUpload',
			'EnvironmentID' => $data['EnvironmentID']
		));
		$dataTransfer->write();
		$dataArchive->DataTransfers()->add($dataTransfer);
		$form->saveInto($dataArchive);
		$dataArchive->write();

		return $this->customise(array(
			'Project' => $project,
			'CurrentProject' => $project,
			'SnapshotsSection' => 1,
			'DataArchive' => $dataArchive,
			'DataTransferRestoreForm' => $this->getDataTransferRestoreForm($this->request, $dataArchive),
			'BackURL' => $project->Link('snapshots')
		))->renderWith(array('DNRoot_uploadsnapshot', 'DNRoot'));
	}

	/**
	 * @param SS_HTTPRequest $request
	 * @return Form
	 */
	public function getPostSnapshotForm(SS_HTTPRequest $request) {
		// Performs permission check by limiting visible projects
		$project = $this->getCurrentProject();

		// Framing an environment as a "group of people with download access"
		// makes more sense to the user here, while still allowing us to enforce
		// environment specific restrictions on downloading the file later on.
		$envs = $project->DNEnvironmentList()->filterByCallback(function($item) {return $item->canUploadArchive();});
		$envsMap = array();
		foreach($envs as $env) {
			$downloaders = implode(', ', $env->ArchiveDownloaders()->column('FirstName'));
			$envsMap[$env->ID] = sprintf(
				'%s (%s)',
				implode(', ', array_map(function($member) {return $member->Name;}, $env->ArchiveDownloaders()->toArray())),
				$env->Name
			);
		}

		$form = new Form(
			$this, 
			'PostSnapshotForm', 
			new FieldList(
				DropdownField::create('Mode', 'What does this file contain?', DNDataArchive::get_mode_map()),
				DropdownField::create('EnvironmentID', 'Choose who can download this file', $envsMap)
			), 
			new FieldList(
				$action = new FormAction('doPostSnapshot', "Submit request")
			),
			new RequiredFields('File')
		);
		$action->addExtraClass('btn');
		$form->disableSecurityToken();
		$form->addExtraClass('fields-wide');
		// Tweak the action so it plays well with our fake URL structure.
		$form->setFormAction($project->Link().'/PostSnapshotForm');

		return $form;
	}

	public function doPostSnapshot($data, $form) {
		$project = $this->getCurrentProject();
		if(!$project) {
			return new SS_HTTPResponse("Project '" . $request->latestParam('Project') . "' not found.", 404);
		}

		$validEnvs = $project->DNEnvironmentList()
			->filterByCallback(function($item) {return $item->canUploadArchive();});
		$environment = $validEnvs->find('ID', $data['EnvironmentID']);
		if(!$environment) {
			throw new LogicException('Invalid environment');
		}

		$dataArchive = new DNDataArchive(array(
			'UploadToken' => DNDataArchive::generate_upload_token(),
		));
		$form->saveInto($dataArchive);
		$dataArchive->write(); 

		return $this->redirect(Controller::join_links(
			$project->Link(),
			'postsnapshotsuccess',
			$dataArchive->ID
		));
	}

	/**
	 * Action
	 * 
	 * @return string - HTML
	 */
	public function snapshotslog(SS_HTTPRequest $request) {
		// Performs permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return new SS_HTTPResponse("Project '" . $request->latestParam('Project') . "' not found.", 404);
		}
		return $this->customise(array(
			'Title' => 'Data Snapshots Log',
			'Project' => $project,
			'CurrentProject' => $project,
			'SnapshotsSection' => 1,
		))->renderWith(array('DNRoot_snapshotslog', 'DNRoot'));
	}

	/**
	 * @param  SS_HTTPRequest $request [description]
	 */
	public function postsnapshotsuccess(SS_HTTPRequest $request) {
		$project = $this->getCurrentProject();

		$dataArchive = DNDataArchive::get()->byId($request->param('DataArchiveID'));
		if(!$dataArchive) {
			return new SS_HTTPResponse("Archive not found.", 404);
		}

		return $this->customise(array(
			'Title' => 'How to send us your Data Snapshot by post',
			'Project' => $project,
			'CurrentProject' => $project,
			'DataArchive' => $dataArchive,
			'Address' => Config::inst()->get('Deploynaut', 'snapshot_post_address'),
			'BackURL' => $project->Link(),
		))->renderWith(array('DNRoot_postsnapshotsuccess', 'DNRoot'));
	}

	/**
	 * 
	 * @param SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function project(SS_HTTPRequest $request) {
		// Performs permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return new SS_HTTPResponse("Project '" . $request->latestParam('Project') . "' not found.", 404);
		}
		return $this->customise(array(
			'Project' => $project,
			'CurrentProject' => $project,
			'ProjectOverview' => 1,
			'DataTransferForm' => $this->getDataTransferForm($request)
		))->renderWith(array('DNRoot_project', 'DNRoot'));
	}

	/**
	 * 
	 * @param SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function environment(SS_HTTPRequest $request) {
		// Performs permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return new SS_HTTPResponse("Project '" . $request->latestParam('Project') . "' not found.", 404);
		}

		$env = $this->getCurrentEnvironment($project);
		if(!$env) {
			return new SS_HTTPResponse("Environment '" . $request->latestParam('Environment') . "' not found.", 404);
		}

		return $env->customise(array(
			'DeployForm' => $this->getDeployForm($request),
			'CurrentProject' => $project,
			'DNEnvironmentList' => $this->getCurrentProject()->DNEnvironmentList()
			// Project comes from DNEnvironment, which is the current project already
		))->renderWith(array('DNRoot_environment', 'DNRoot'));
	}

	/**
	 * 
	 * @param SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function metrics($request) {
		// Performs permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return new SS_HTTPResponse("Project '" . $request->latestParam('Project') . "' not found.", 404);
		}

		$env = $this->getCurrentEnvironment($project);
		if(!$env) {
			return new SS_HTTPResponse("Environment '" . $request->latestParam('Environment') . "' not found.", 404);
		}

		return $env->customise(array(
			'Project' => $project,
			'CurrentProject' => $project,
		))->renderWith(array('DNRoot_metrics', 'DNRoot'));
	}

	/**
	 * Get the DNData object.
	 *
	 * @return DNData
	 */
	public function DNData() {
		return Injector::inst()->get('DNData');
	}

	/**
	 * Provide DNProjectList (with all projects enumerated within).
	 * 
	 * @return DataList
	 */
	public function DNProjectList() {
		return DataObject::get('DNProject')->filterByCallback(function($record) {
			return $record->canView();
		});
	}

	/**
	 * Construct the deployment form
	 * 
	 * @param SS_HTTPRequest $request
	 * @return Form
	 */
	public function getDeployForm(SS_HTTPRequest $request) {
		// Performs permission check by limiting visible projects
		$project = $this->getCurrentProject();
		$environment = $this->getCurrentEnvironment($project);

		if(!$environment->canDeploy()) {
			return null;
		}
		
		if(!$project->repoExists()) {
			$literalField = new LiteralField('noRepoWarning', '<strong>The GIT repository is for the time being not available.</strong>');
			return Form::create($this, 'DeployForm', new FieldList($literalField), new FieldList());
		}

		$branches = array();
		foreach($project->DNBranchList() as $branch) {
			$sha = $branch->SHA();
			$name = $branch->Name();
			$branches[$sha] = $name . ' (' . substr($sha,0,8) . ', ' . $branch->LastUpdated()->TimeDiff() . ' old)';
		}

		$tags = array();
		foreach($project->DNTagList()->setLimit(null) as $tag) {
			$sha = $tag->SHA();
			$name = $tag->Name();

			$tags[$sha] = $name . ' (' . substr($sha,0,8) . ', ' . $tag->Created()->TimeDiff() . ' old)';
		}
		$tags = array_reverse($tags);

		$redeploy = array();
		foreach($project->DNEnvironmentList() as $dnEnvironment) {
			$envName = $dnEnvironment->Name;
			foreach($dnEnvironment->DeployHistory() as $deploy) {
				$sha = $deploy->SHA;
				if(!isset($redeploy[$envName])) {
					$redeploy[$envName] = array();
				}
				if(!isset($redeploy[$envName][$sha])) {
					$redeploy[$envName][$sha] = substr($sha,0,8) . ' (deployed ' . $deploy->obj('LastEdited')->Ago() . ')';
				}
			}
		}

		$releaseMethods = array();
		if($tags) {
			$releaseMethods[] = new SelectionGroup_Item(
				'Tag',
				new DropdownField('Tag', '', $tags),
				'Deploy a tagged release'
			);
		}
		if($branches) {
			$releaseMethods[] = new SelectionGroup_Item(
				'Branch',
				new DropdownField('Branch', '', $branches),
				'Deploy the latest version of a branch'
			);
		}
		if($redeploy) {
			$releaseMethods[] = new SelectionGroup_Item(
				'Redeploy',
				new GroupedDropdownField('Redeploy', '', $redeploy),
				'Redeploy a release that was previously deployed (to any environment)'
			);
		}
		
		$releaseMethods[] = new SelectionGroup_Item(
			'SHA',
			new Textfield('SHA', 'Please specify the full SHA'),
			'Deploy a specific SHA'
		);

		$field = new SelectionGroup('SelectRelease', $releaseMethods);
		$field->setValue('Tag');

		$form = new Form($this, 'DeployForm', new FieldList(
			$field
		), new FieldList(
			$deployAction = new FormAction('doDeploy', "Deploy to " . $environment->Name)
		));
		$deployAction->addExtraClass('btn');
		$form->disableSecurityToken();
		// Tweak the action so it plays well with our fake URL structure.
		$form->setFormAction($request->getURL().'/DeployForm');
		return $form;
	}

	/**
	 * Deployment form submission handler.
	 *
	 * Initiate a DNDeployment record and redirect to it for status polling
	 * 
	 * @return \SS_HTTPResponse
	 */
	public function doDeploy($data, $form) {
		if(in_array($data['SelectRelease'], array('Tag','Branch','Redeploy','SHA'))) {
			$buildName = $data[$data['SelectRelease']];
		} else {
			throw new LogicException("Bad release selection method '{$data['SelectRelease']}'");
		}
		$project = $this->getCurrentProject();
		$environment = $this->getCurrentEnvironment($project);
		$sha = $project->DNBuildList()->byName($buildName);

		$deployment = new DNDeployment;
		$deployment->EnvironmentID = $environment->ID;
		$deployment->SHA = $sha->FullName();
		$deployment->write();
		$deployment->start();
		
		$this->redirect($deployment->Link());
	}

	/**
	 * Action - Do the actual deploy
	 *
	 * @param SS_HTTPRequest $request
	 */
	public function deploy(SS_HTTPRequest $request) {
		$params = $request->params();
		$deployment = DNDeployment::get()->byId($params['Identifier']);

		if(!$deployment || !$deployment->ID) throw new SS_HTTPResponse_Exception('Deployment not found', 404);
		if(!$deployment->canView()) return Security::permissionFailure();

		$environment = $deployment->Environment();
		$project = $environment->Project();

		if($environment->Name != $params['Environment']) throw new LogicException("Environment in URL doesn't match this deploy");
		if($project->Name != $params['Project']) throw new LogicException("Project in URL doesn't match this deploy");

		return $this->customise(new ArrayData(array(
			'Deployment' => $deployment,
		)))->renderWith('DNRoot_deploy');
	}

	/**
	 * Action - Get the latest deploy log
	 *
	 * @return string
	 */
	public function deploylog(SS_HTTPRequest $request) {
		$params = $request->params();
		$deployment = DNDeployment::get()->byId($params['Identifier']);

		if(!$deployment || !$deployment->ID) throw new SS_HTTPResponse_Exception('Deployment not found', 404);
		if(!$deployment->canView()) return Security::permissionFailure();

		$environment = $deployment->Environment();
		$project = $environment->Project();

		if($environment->Name != $params['Environment']) throw new LogicException("Environment in URL doesn't match this deploy");
		if($project->Name != $params['Project']) throw new LogicException("Project in URL doesn't match this deploy");

		$log = $deployment->log();
		if($log->exists()) {
			$content = $log->content();
		} else {
			$content = 'Waiting for action to start';
		}

		$sendJSON = (strpos($request->getHeader('Accept'), 'application/json') !== false)
			|| $request->getExtension() == 'json';

		
		$content = preg_replace('/(?:(?:\r\n|\r|\n)\s*){2}/s', "\n", $content);
		if($sendJSON) {
			$this->response->addHeader("Content-type", "application/json");
			return json_encode(array(
				'status' => $deployment->ResqueStatus(),
				'content' => $content,
			));

		} else {
			$this->response->addHeader("Content-type", "text/plain");
			return $content;
		}

	}

	/**
	 * @return Form
	 */
	public function getDataTransferForm($request) {
		$envs = $this->getCurrentProject()->DNEnvironmentList()
			->filterByCallback(function($item) {return $item->canBackup();});

		$form = new Form(
			$this,
			'DataTransferForm',
			new FieldList(
				new HiddenField('Direction', false, 'get'),
				new DropdownField('EnvironmentID', 'Environment', $envs->map()),
				new DropdownField('Mode', 'Transfer', DNDataArchive::get_mode_map())
			),
			new FieldList(
				FormAction::create('doDataTransfer', 'Create')->addExtraClass('btn')
			)
		);
		$form->setFormAction($request->getURL().'/DataTransferForm');

		return $form;
	}

	public function doDataTransfer($data, $form) {
		$project = $this->getCurrentProject();
		$member = Member::currentUser();
		$dataArchive = null;
		$validEnvs = $this->getCurrentProject()->DNEnvironmentList()
			->filterByCallback(function($item) {return $item->canBackup();});

		$environment = $validEnvs->find('ID', $data['EnvironmentID']);
		if(!$environment) {
			throw new LogicException('Invalid environment');
		}

		// Only 'push' direction is allowed an association with an existing archive.
		if(
			$data['Direction'] == 'push'
			&& isset($data['DataArchiveID']) 
			&& is_numeric($data['DataArchiveID'])
		) {
			$dataArchive = DNDataArchive::get()->byId($data['DataArchiveID']);
			if(!$dataArchive) {
				throw new LogicException('Invalid data archive');
			}
		}

		$job = new DNDataTransfer;
		$job->EnvironmentID = $environment->ID;
		$job->Direction = $data['Direction'];
		$job->Mode = $data['Mode'];
		$job->DataArchiveID = $dataArchive ? $dataArchive->ID : null;
		$job->write();
		$job->start();
		
		$this->redirect($job->Link());
	}

	/**
	 * View into the log for a {@link DNDataTransfer}.
	 */
	public function transfer($request) {
		$params = $request->params();
		$transfer = DNDataTransfer::get()->byId($params['Identifier']);

		if(!$transfer || !$transfer->ID) throw new SS_HTTPResponse_Exception('Transfer not found', 404);
		if(!$transfer->canView()) return Security::permissionFailure();

		$environment = $transfer->Environment();
		$project = $environment->Project();

		if($project->Name != $params['Project']) throw new LogicException("Project in URL doesn't match this deploy");

		return $this->customise(new ArrayData(array(
			'Transfer' => $transfer,
			'SnapshotsSection' => 1,
		)))->renderWith('DNRoot_transfer');
	}

	/**
	 * Action - Get the latest deploy log
	 *
	 * @return string
	 */
	public function transferlog(SS_HTTPRequest $request) {
		$params = $request->params();
		$transfer = DNDataTransfer::get()->byId($params['Identifier']);

		if(!$transfer || !$transfer->ID) throw new SS_HTTPResponse_Exception('Transfer not found', 404);
		if(!$transfer->canView()) return Security::permissionFailure();

		$environment = $transfer->Environment();
		$project = $environment->Project();

		if($project->Name != $params['Project']) throw new LogicException("Project in URL doesn't match this deploy");

		$log = $transfer->log();
		if($log->exists()) {
			$content = $log->content();
		} else {
			$content = 'Waiting for action to start';
		}

		$sendJSON = (strpos($request->getHeader('Accept'), 'application/json') !== false)
			|| $request->getExtension() == 'json';

		
		$content = preg_replace('/(?:(?:\r\n|\r|\n)\s*){2}/s', "\n", $content);
		if($sendJSON) {
			$this->response->addHeader("Content-type", "application/json");
			return json_encode(array(
				'status' => $transfer->ResqueStatus(),
				'content' => $content,
			));

		} else {
			$this->response->addHeader("Content-type", "text/plain");
			return $content;
		}

	}

	/**
	 * Note: Submits to the same action as {@link getDataTransferForm()},
	 * but with a Direction=push and an archive reference.
	 * 
	 * @param  SS_HTTPRequest $request
	 * @param  DNDataArchive $dataArchive Only set when method is called manually in {@link restore()},
	 *                            otherwise the state is inferred from the request data.
	 * @return Form
	 */
	public function getDataTransferRestoreForm($request, $dataArchive = null) {
		$dataArchive = $dataArchive ? $dataArchive : DNDataArchive::get()->byId($request->requestVar('DataArchiveID'));
		$project = $this->getCurrentProject();
		$envs = $project->DNEnvironmentList()
			->filterByCallback(function($item) {return $item->canRestore();});

		$modesMap = array();
		if(in_array($dataArchive->Mode, array('all'))) {
			$modesMap['all'] = 'Database and Assets';
		};
		if(in_array($dataArchive->Mode, array('all', 'db'))) {
			$modesMap['db'] = 'Database only';
		};
		if(in_array($dataArchive->Mode, array('all', 'assets'))) {
			$modesMap['assets'] = 'Assets only';
		};

		$form = new Form(
			$this,
			'DataTransferRestoreForm',
			new FieldList(
				new HiddenField('DataArchiveID', false, $dataArchive->ID),
				new HiddenField('Direction', false, 'push'),
				new DropdownField('EnvironmentID', 'Environment', $envs->map()),
				new DropdownField('Mode', 'Transfer', $modesMap)
			),
			new FieldList(
				FormAction::create('doDataTransfer', 'Restore Data')->addExtraClass('btn')
			)
		);
		$form->setFormAction($project->Link() . '/DataTransferRestoreForm');

		return $form;
	}

	/**
	 * View a form to restore a specific {@link DataArchive}.
	 * Permission checks are handled in {@link DataArchives()}.
	 * Submissions are handled through {@link doDataTransfer()}, same as backup operations.
	 */
	public function restoresnapshot($request) {
		$dataArchive = DNDataArchive::get()->byId($request->param('DataArchiveID'));
		
		if(!$dataArchive) {
			throw new SS_HTTPResponse_Exception('Archive not found', 404);
		}

		if(!$dataArchive->canRestore()) {
			throw new SS_HTTPResponse_Exception('Not allowed to restore archive', 403);
		}

		$form = $this->getDataTransferRestoreForm($this->request, $dataArchive);

		// View currently only available via ajax
		return $form->forTemplate();
	}

	/**
	 * 
	 * @return array
	 */
	public static function get_template_global_variables() {
		return array(
			'RedisUnavailable' => 'RedisUnavailable',
			'RedisWorkersCount' => 'RedisWorkersCount'
		);
	}

	/**
	 * Returns an error message if redis is unavailable
	 *
	 * @return string
	 */
	public static function RedisUnavailable() {
		try {
			Resque::queues();
		} catch(Exception $e) {
			return $e->getMessage();
		}
		return '';
	}

	/**
	 * Returns the number of connected Redis workers
	 *
	 * @return int
	 */
	public static function RedisWorkersCount() {
		return count(Resque_Worker::all());
	}

	/**
	 *
	 * @return array
	 */
	public function providePermissions() {
		return array(
			"DEPLOYNAUT_ACCESS" => array(
				'name' => "Access to Deploynaut",
				'category' => "Deploynaut",
			),
		);
	}
	
	/**
	 * 
	 * @return DNProject
	 */
	protected function getCurrentProject() {
		return $this->DNProjectList()->filter('Name', $this->getRequest()->latestParam('Project'))->First();
	}
	
	/**
	 * 
	 * @param DNProject $project
	 * @return DNEnvironment
	 */
	protected function getCurrentEnvironment($project = null) {
		if(!$project) $project = $this->getCurrentProject();
		return $project->DNEnvironmentList()->filter('Name', $this->getRequest()->latestParam('Environment'))->First();
	}

	/**
	 * Helper method to allow templates to know whether they should show the 'Archive List' include or not.
	 * The actual permissions are set on a per-environment level, so we need to find out if this $member can upload to
	 * or download from *any* {@link DNEnvironment} that (s)he has access to.
	 *
	 * TODO To be replaced with a method that just returns the list of archives this {@link Member} has access to.
	 *
	 * @param Member $member The {@link Member} to check (or null to check the currently logged in Member)
	 * @return boolean true if $member has access to upload or download to at least one {@link DNEnvironment}.
	 */
	public function CanViewArchives(Member $member = null) {
		if(!$member) $member = Member::currentUser();

		if(Permission::checkMember($member, 'ADMIN')) return true;

		$allProjects = $this->DNProjectList();
		if(!$allProjects) return false;

		foreach($allProjects as $project) {
			if($project->Environments()) {
				foreach($project->Environments() as $environment) {
					if(
						$environment->canRestore($member) ||
						$environment->canBackup($member) ||
						$environment->canUploadArchive($member) ||
						$environment->canDownloadArchive($member)
					) {
						return true; // We can return early as we only need to know that we can access one environment
					}
				}
			}
		}
	}

	/**
	 * @return ArrayList The list of all archive files that can be accessed by the currently logged-in {@link Member}
	 */
	public function CompleteDataArchives() {
		$project = $this->getCurrentProject();
		$archives = new ArrayList();
		foreach($project->DNEnvironmentList() as $env) {
			foreach($env->DataArchives() as $archive) {
				if($archive->canView() && !$archive->isPending()) $archives->push($archive);
			}
		}
		return new PaginatedList($archives->sort("Created", "DESC"), $this->request);
	}

	/**
	 * @return ArrayList The list of "pending" data archives which are waiting for a file
	 * to be delivered offline by post, and manually uploaded into the system.
	 */
	public function PendingDataArchives() {
		$project = $this->getCurrentProject();
		$archives = new ArrayList();
		foreach($project->DNEnvironmentList() as $env) {
			foreach($env->DataArchives() as $archive) {
				if($archive->canView() && $archive->isPending()) $archives->push($archive);
			}
		}
		return new PaginatedList($archives->sort("Created", "DESC"), $this->request);
	}

	public function DataTransferLogs() {
		$project = $this->getCurrentProject();

		$transfers = DNDataTransfer::get()->filterByCallback(function($record) use($project) {
			return
				$record->Environment()->Project()->ID == $project->ID && // Ensure only the current Project is shown
				(
					$record->Environment()->canRestore() || // Ensure member can perform an action on the transfers env
					$record->Environment()->canBackup() ||
					$record->Environment()->canUploadArchive() ||
					$record->Environment()->canDownloadArchive()
				);
		});

		return new PaginatedList($transfers->sort("Created", "DESC"), $this->request);
	}
}
