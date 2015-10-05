<?php
use \Symfony\Component\Process\Process;

/**
 * God controller for the deploynaut interface
 *
 * @package deploynaut
 * @subpackage control
 */
class DNRoot extends Controller implements PermissionProvider, TemplateGlobalProvider {

	/**
	 * @const string - action type for actions that perform deployments
	 */
	const ACTION_DEPLOY = 'deploy';

	/**
	 * @const string - action type for actions that manipulate snapshots
	 */
	const ACTION_SNAPSHOT = 'snapshot';

	const ACTION_ENVIRONMENTS = 'createenv';

	/**
	 * @var string
	 */
	private $actionType = self::ACTION_DEPLOY;

	/**
	 * Bypass pipeline permission code
	 */
	const DEPLOYNAUT_BYPASS_PIPELINE = 'DEPLOYNAUT_BYPASS_PIPELINE';

	/**
	 * Allow dryrun of pipelines
	 */
	const DEPLOYNAUT_DRYRUN_PIPELINE = 'DEPLOYNAUT_DRYRUN_PIPELINE';

	/**
	 * Allow advanced options on deployments
	 */
	const DEPLOYNAUT_ADVANCED_DEPLOY_OPTIONS = 'DEPLOYNAUT_ADVANCED_DEPLOY_OPTIONS';

	const ALLOW_PROD_DEPLOYMENT = 'ALLOW_PROD_DEPLOYMENT';
	const ALLOW_NON_PROD_DEPLOYMENT = 'ALLOW_NON_PROD_DEPLOYMENT';
	const ALLOW_PROD_SNAPSHOT = 'ALLOW_PROD_SNAPSHOT';
	const ALLOW_NON_PROD_SNAPSHOT = 'ALLOW_NON_PROD_SNAPSHOT';
	const ALLOW_CREATE_ENVIRONMENT = 'ALLOW_CREATE_ENVIRONMENT';

	/**
	 * @var array
	 */
	public static $allowed_actions = array(
		'projects',
		'nav',
		'update',
		'project',
		'toggleprojectstar',
		'branch',
		'environment',
		'abortpipeline',
		'pipeline',
		'pipelinelog',
		'metrics',
		'createenvlog',
		'createenv',
		'getDeployForm',
		'doDeploy',
		'deploy',
		'deploylog',
		'getDataTransferForm',
		'transfer',
		'transferlog',
		'snapshots',
		'createsnapshot',
		'snapshotslog',
		'uploadsnapshot',
		'getCreateEnvironmentForm',
		'getUploadSnapshotForm',
		'getPostSnapshotForm',
		'getDataTransferRestoreForm',
		'getDeleteForm',
		'getMoveForm',
		'restoresnapshot',
		'deletesnapshot',
		'movesnapshot',
		'postsnapshotsuccess',
		'gitRevisions',
		'deploySummary',
		'startDeploy',
	);

	/**
	 * URL handlers pretending that we have a deep URL structure.
	 */
	public static $url_handlers = array(
		'project/$Project/environment/$Environment/DeployForm' => 'getDeployForm',
		'project/$Project/createsnapshot/DataTransferForm' => 'getDataTransferForm',
		'project/$Project/DataTransferForm' => 'getDataTransferForm',
		'project/$Project/DataTransferRestoreForm' => 'getDataTransferRestoreForm',
		'project/$Project/DeleteForm' => 'getDeleteForm',
		'project/$Project/MoveForm' => 'getMoveForm',
		'project/$Project/UploadSnapshotForm' => 'getUploadSnapshotForm',
		'project/$Project/PostSnapshotForm' => 'getPostSnapshotForm',
		'project/$Project/environment/$Environment/metrics' => 'metrics',
		'project/$Project/environment/$Environment/pipeline/$Identifier//$Action/$ID/$OtherID' => 'pipeline',
		'project/$Project/environment/$Environment/deploy_summary' => 'deploySummary',
		'project/$Project/environment/$Environment/git_revisions' => 'gitRevisions',
		'project/$Project/environment/$Environment/start-deploy' => 'startDeploy',
		'project/$Project/environment/$Environment/deploy/$Identifier/log' => 'deploylog',
		'project/$Project/environment/$Environment/deploy/$Identifier' => 'deploy',
		'project/$Project/transfer/$Identifier/log' => 'transferlog',
		'project/$Project/transfer/$Identifier' => 'transfer',
		'project/$Project/environment/$Environment' => 'environment',
		'project/$Project/createenv/$Identifier/log' => 'createenvlog',
		'project/$Project/createenv/$Identifier' => 'createenv',
		'project/$Project/CreateEnvironmentForm' => 'getCreateEnvironmentForm',
		'project/$Project/branch' => 'branch',
		'project/$Project/build/$Build' => 'build',
		'project/$Project/restoresnapshot/$DataArchiveID' => 'restoresnapshot',
		'project/$Project/deletesnapshot/$DataArchiveID' => 'deletesnapshot',
		'project/$Project/movesnapshot/$DataArchiveID' => 'movesnapshot',
		'project/$Project/update' => 'update',
		'project/$Project/snapshots' => 'snapshots',
		'project/$Project/createsnapshot' => 'createsnapshot',
		'project/$Project/uploadsnapshot' => 'uploadsnapshot',
		'project/$Project/snapshotslog' => 'snapshotslog',
		'project/$Project/postsnapshotsuccess/$DataArchiveID' => 'postsnapshotsuccess',
		'project/$Project/star' => 'toggleprojectstar',
		'project/$Project' => 'project',
		'projects' => 'projects',
	);

	/**
	 * @var array
	 */
	protected static $_project_cache = array();

	/**
	 * @var array
	 */
	private static $support_links = array();

	/**
	 * @var array
	 */
	private static $platform_specific_strings = array();

	/**
	 * @var array
	 */
	private static $action_types = array(
		self::ACTION_DEPLOY,
		self::ACTION_SNAPSHOT
	);

	/**
	 * @var DNData
	 */
	protected $data;

	/**
	 * Include requirements that deploynaut needs, such as javascript.
	 */
	public static function include_requirements() {

		// JS should always go to the bottom, otherwise there's the risk that Requirements
		// puts them halfway through the page to the nearest <script> tag. We don't want that.
		Requirements::set_force_js_to_bottom(true);

		Requirements::combine_files(
			'deploynaut.js',
			array(
				'deploynaut/javascript/jquery.js',
				'deploynaut/javascript/bootstrap.js',
				'deploynaut/javascript/q.js',
				'deploynaut/javascript/tablefilter.js',
				'deploynaut/javascript/deploynaut.js',
				'deploynaut/javascript/react-with-addons.js',
				'deploynaut/javascript/bootstrap.file-input.js',
				'deploynaut/thirdparty/select2/dist/js/select2.min.js',
				'deploynaut/javascript/material.js',
			)
		);

		if (\Director::isDev()) {
			\Requirements::javascript('deploynaut/static/bundle-debug.js');
		} else {
			\Requirements::javascript('deploynaut/static/bundle.js');
		}

		Requirements::css('deploynaut/static/style.css');
	}

	/**
	 * Check for feature flags:
	 * - FLAG_SNAPSHOTS_ENABLED: set to true to enable globally
	 * - FLAG_SNAPSHOTS_ENABLED_FOR_MEMBERS: set to semicolon-separated list of email addresses of allowed users.
	 *
	 * @return boolean
	 */
	public static function FlagSnapshotsEnabled() {
		if(defined('FLAG_SNAPSHOTS_ENABLED') && FLAG_SNAPSHOTS_ENABLED) {
			return true;
		}
		if(defined('FLAG_SNAPSHOTS_ENABLED_FOR_MEMBERS') && FLAG_SNAPSHOTS_ENABLED_FOR_MEMBERS) {
			$allowedMembers = explode(';', FLAG_SNAPSHOTS_ENABLED_FOR_MEMBERS);
			$member = Member::currentUser();
			if($allowedMembers && $member && in_array($member->Email, $allowedMembers)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @return ArrayList
	 */
	public static function get_support_links() {
		$supportLinks = self::config()->support_links;
		if($supportLinks) {
			return new ArrayList($supportLinks);
		}
	}

	/**
	 * @return array
	 */
	public static function get_template_global_variables() {
		return array(
			'RedisUnavailable' => 'RedisUnavailable',
			'RedisWorkersCount' => 'RedisWorkersCount',
			'SidebarLinks' => 'SidebarLinks',
			"SupportLinks" => 'get_support_links'
		);
	}

	/**
	 */
	public function init() {
		parent::init();

		if(!Member::currentUser() && !Session::get('AutoLoginHash')) {
			return Security::permissionFailure();
		}

		// Block framework jquery
		Requirements::block(FRAMEWORK_DIR . '/thirdparty/jquery/jquery.js');

		self::include_requirements();
	}

	/**
	 * @return string
	 */
	public function Link() {
		return "naut/";
	}

	/**
	 * Actions
	 *
	 * @param SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function index(SS_HTTPRequest $request) {
		return $this->redirect($this->Link() . 'projects/');
	}

	/**
	 * Action
	 *
	 * @param SS_HTTPRequest $request
	 * @return string - HTML
	 */
	public function projects(SS_HTTPRequest $request) {
		// Performs canView permission check by limiting visible projects in DNProjectsList() call.
		return $this->customise(array(
			'Title' => 'Projects',
		))->render();
	}

	/**
	 * @param SS_HTTPRequest $request
	 * @return HTMLText
	 */
	public function nav(SS_HTTPRequest $request) {
		return $this->renderWith('Nav');
	}

	/**
	 * Return a link to the navigation template used for AJAX requests.
	 * @return string
	 */
	public function NavLink() {
		return Controller::join_links(Director::absoluteBaseURL(), 'naut', 'nav');
	}

	/**
	 * Action
	 *
	 * @param SS_HTTPRequest $request
	 * @return SS_HTTPResponse - HTML
	 */
	public function snapshots(SS_HTTPRequest $request) {
		$this->setCurrentActionType(self::ACTION_SNAPSHOT);
		return $this->getCustomisedViewSection('SnapshotsSection', 'Data Snapshots');
	}

	/**
	 * Action
	 *
	 * @param SS_HTTPRequest $request
	 * @return string - HTML
	 */
	public function createsnapshot(SS_HTTPRequest $request) {
		$this->setCurrentActionType(self::ACTION_SNAPSHOT);

		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		if(!$project->canBackup()) {
			return new SS_HTTPResponse("Not allowed to create snapshots on any environments", 401);
		}

		return $this->customise(array(
			'Title' => 'Create Data Snapshot',
			'SnapshotsSection' => 1,
			'DataTransferForm' => $this->getDataTransferForm($request)
		))->render();
	}

	/**
	 * Action
	 *
	 * @param SS_HTTPRequest $request
	 * @return string - HTML
	 */
	public function uploadsnapshot(SS_HTTPRequest $request) {
		$this->setCurrentActionType(self::ACTION_SNAPSHOT);

		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		if(!$project->canUploadArchive()) {
			return new SS_HTTPResponse("Not allowed to upload", 401);
		}

		return $this->customise(array(
			'SnapshotsSection' => 1,
			'UploadSnapshotForm' => $this->getUploadSnapshotForm($request),
			'PostSnapshotForm' => $this->getPostSnapshotForm($request)
		))->render();
	}

	/**
	 * Return the upload limit for snapshot uploads
	 * @return string
	 */
	public function UploadLimit() {
		return File::format_size(min(
			File::ini2bytes(ini_get('upload_max_filesize')),
			File::ini2bytes(ini_get('post_max_size'))
		));
	}

	/**
	 * Construct the upload form.
	 *
	 * @param SS_HTTPRequest $request
	 * @return Form
	 */
	public function getUploadSnapshotForm(SS_HTTPRequest $request) {
		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		if(!$project->canUploadArchive()) {
			return new SS_HTTPResponse("Not allowed to upload", 401);
		}

		// Framing an environment as a "group of people with download access"
		// makes more sense to the user here, while still allowing us to enforce
		// environment specific restrictions on downloading the file later on.
		$envs = $project->DNEnvironmentList()->filterByCallback(function($item) {
			return $item->canUploadArchive();
		});
		$envsMap = array();
		foreach($envs as $env) {
			$envsMap[$env->ID] = $env->Name;
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
				DropdownField::create('EnvironmentID', 'Initial ownership of the file', $envsMap)
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
		$form->setFormAction($project->Link() . '/UploadSnapshotForm');

		return $form;
	}

	/**
	 * @param array $data
	 * @param Form $form
	 *
	 * @return bool|HTMLText|SS_HTTPResponse
	 */
	public function doUploadSnapshot($data, Form $form) {
		$this->setCurrentActionType(self::ACTION_SNAPSHOT);

		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		$validEnvs = $project->DNEnvironmentList()
			->filterByCallback(function($item) {
				return $item->canUploadArchive();
			});

		// Validate $data['EnvironmentID'] by checking against $validEnvs.
		$environment = $validEnvs->find('ID', $data['EnvironmentID']);
		if(!$environment) {
			throw new LogicException('Invalid environment');
		}

		$this->validateSnapshotMode($data['Mode']);

		$dataArchive = DNDataArchive::create(array(
			'AuthorID' => Member::currentUserID(),
			'EnvironmentID' => $data['EnvironmentID'],
			'IsManualUpload' => true,
		));
		// needs an ID and transfer to determine upload path
		$dataArchive->write();
		$dataTransfer = DNDataTransfer::create(array(
			'AuthorID' => Member::currentUserID(),
			'Mode' => $data['Mode'],
			'Origin' => 'ManualUpload',
			'EnvironmentID' => $data['EnvironmentID']
		));
		$dataTransfer->write();
		$dataArchive->DataTransfers()->add($dataTransfer);
		$form->saveInto($dataArchive);
		$dataArchive->write();
		$workingDir = TEMP_FOLDER . DIRECTORY_SEPARATOR . 'deploynaut-transfer-' . $dataTransfer->ID;

		$cleanupFn = function() use($workingDir, $dataTransfer, $dataArchive) {
			$process = new Process(sprintf('rm -rf %s', escapeshellarg($workingDir)));
			$process->run();
			$dataTransfer->delete();
			$dataArchive->delete();
		};

		// extract the sspak contents so we can inspect them
		try {
			$dataArchive->extractArchive($workingDir);
		} catch(Exception $e) {
			$cleanupFn();
			$form->sessionMessage(
				'There was a problem trying to open your snapshot for processing. Please try uploading again',
				'bad'
			);
			return $this->redirectBack();
		}

		// validate that the sspak contents match the declared contents
		$result = $dataArchive->validateArchiveContents();
		if(!$result->valid()) {
			$cleanupFn();
			$form->sessionMessage($result->message(), 'bad');
			return $this->redirectBack();
		}

		// fix file permissions of extracted sspak files then re-build the sspak
		try {
			$dataArchive->fixArchivePermissions($workingDir);
			$dataArchive->setArchiveFromFiles($workingDir);
		} catch(Exception $e) {
			$cleanupFn();
			$form->sessionMessage(
				'There was a problem processing your snapshot. Please try uploading again',
				'bad'
			);
			return $this->redirectBack();
		}

		// cleanup any extracted sspak contents lying around
		$process = new Process(sprintf('rm -rf %s', escapeshellarg($workingDir)));
		$process->run();

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
		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		if(!$project->canUploadArchive()) {
			return new SS_HTTPResponse("Not allowed to upload", 401);
		}

		// Framing an environment as a "group of people with download access"
		// makes more sense to the user here, while still allowing us to enforce
		// environment specific restrictions on downloading the file later on.
		$envs = $project->DNEnvironmentList()->filterByCallback(function($item) {
			return $item->canUploadArchive();
		});
		$envsMap = array();
		foreach($envs as $env) {
			$envsMap[$env->ID] = $env->Name;
		}

		$form = new Form(
			$this,
			'PostSnapshotForm',
			new FieldList(
				DropdownField::create('Mode', 'What does this file contain?', DNDataArchive::get_mode_map()),
				DropdownField::create('EnvironmentID', 'Initial ownership of the file', $envsMap)
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
		$form->setFormAction($project->Link() . '/PostSnapshotForm');

		return $form;
	}

	/**
	 * @param array $data
	 * @param Form $form
	 *
	 * @return SS_HTTPResponse
	 */
	public function doPostSnapshot($data, $form) {
		$this->setCurrentActionType(self::ACTION_SNAPSHOT);

		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		$validEnvs = $project->DNEnvironmentList()->filterByCallback(function($item) {
				return $item->canUploadArchive();
		});

		// Validate $data['EnvironmentID'] by checking against $validEnvs.
		$environment = $validEnvs->find('ID', $data['EnvironmentID']);
		if(!$environment) {
			throw new LogicException('Invalid environment');
		}

		$dataArchive = DNDataArchive::create(array(
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
	 * @param SS_HTTPRequest $request
	 * @return SS_HTTPResponse - HTML
	 */
	public function snapshotslog(SS_HTTPRequest $request) {
		$this->setCurrentActionType(self::ACTION_SNAPSHOT);
		return $this->getCustomisedViewSection('SnapshotsSection', 'Data Snapshots Log');
	}

	/**
	 * @param SS_HTTPRequest $request
	 * @return SS_HTTPResponse|string
	 * @throws SS_HTTPResponse_Exception
	 */
	public function postsnapshotsuccess(SS_HTTPRequest $request) {
		$this->setCurrentActionType(self::ACTION_SNAPSHOT);

		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		if(!$project->canUploadArchive()) {
			return new SS_HTTPResponse("Not allowed to upload", 401);
		}

		$dataArchive = DNDataArchive::get()->byId($request->param('DataArchiveID'));
		if(!$dataArchive) {
			return new SS_HTTPResponse("Archive not found.", 404);
		}

		if(!$dataArchive->canRestore()) {
			throw new SS_HTTPResponse_Exception('Not allowed to restore archive', 403);
		}

		return $this->render(array(
				'Title' => 'How to send us your Data Snapshot by post',
				'DataArchive' => $dataArchive,
				'Address' => Config::inst()->get('Deploynaut', 'snapshot_post_address'),
				'BackURL' => $project->Link(),
			));
	}

	/**
	 * @param SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function project(SS_HTTPRequest $request) {
		return $this->getCustomisedViewSection('ProjectOverview');
	}

	/**
	 * This action will star / unstar a project for the current member
	 *
	 * @param SS_HTTPRequest $request
	 *
	 * @return SS_HTTPResponse
	 */
	public function toggleprojectstar(SS_HTTPRequest $request) {
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		$member = Member::currentUser();
		if($member === null) {
			return $this->project404Response();
		}
		$favProject = $member->StarredProjects()
			->filter('DNProjectID', $project->ID)
			->first();

		if($favProject) {
			$member->StarredProjects()->remove($favProject);
		} else {
			$member->StarredProjects()->add($project);
		}
		return $this->redirectBack();
	}

	/**
	 * @param SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function branch(SS_HTTPRequest $request) {
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		$branchName = $request->getVar('name');
		$branch = $project->DNBranchList()->byName($branchName);
		if(!$branch) {
			return new SS_HTTPResponse("Branch '" . Convert::raw2xml($branchName) . "' not found.", 404);
		}

		return $this->render(array(
			'CurrentBranch' => $branch,
		));
	}

	/**
	 * @param SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function environment(SS_HTTPRequest $request) {
		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		// Performs canView permission check by limiting visible projects
		$env = $this->getCurrentEnvironment($project);
		if(!$env) {
			return $this->environment404Response();
		}

		return $this->render(array(
			'DNEnvironmentList' => $this->getCurrentProject()->DNEnvironmentList(),
			'FlagSnapshotsEnabled' => $this->FlagSnapshotsEnabled(),
		));
	}


	/**
	 * Initiate a pipeline dry run
	 *
	 * @param array $data
	 * @param DeployForm $form
	 *
	 * @return SS_HTTPResponse
	 */
	public function doDryRun($data, DeployForm $form) {
		return $this->beginPipeline($data, $form, true);
	}

	/**
	 * Initiate a pipeline
	 *
	 * @param array $data
	 * @param DeployForm $form
	 * @return \SS_HTTPResponse
	 */
	public function startPipeline($data, $form) {
		return $this->beginPipeline($data, $form);
	}

	/**
	 * Start a pipeline
	 *
	 * @param array $data
	 * @param DeployForm $form
	 * @param bool $isDryRun
	 * @return \SS_HTTPResponse
	 */
	protected function beginPipeline($data, DeployForm $form, $isDryRun = false) {
		$buildName = $form->getSelectedBuild($data);

		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		// Performs canView permission check by limiting visible projects
		$environment = $this->getCurrentEnvironment($project);
		if(!$environment) {
			return $this->environment404Response();
		}

		if(!$environment->DryRunEnabled && $isDryRun) {
			return new SS_HTTPResponse("Dry-run for pipelines is not enabled for this environment", 404);
		}

		// Initiate the pipeline
		$sha = $project->DNBuildList()->byName($buildName);
		$pipeline = Pipeline::create();
		$pipeline->DryRun = $isDryRun;
		$pipeline->EnvironmentID = $environment->ID;
		$pipeline->AuthorID = Member::currentUserID();
		$pipeline->SHA = $sha->FullName();
		// Record build at time of execution
		if($currentBuild = $environment->CurrentBuild()) {
			$pipeline->PreviousDeploymentID = $currentBuild->ID;
		}
		$pipeline->start(); // start() will call write(), so no need to do it here as well.
		return $this->redirect($environment->Link());
	}

	/**
	 * @param SS_HTTPRequest $request
	 *
	 * @return SS_HTTPResponse
	 * @throws SS_HTTPResponse_Exception
	 */
	public function pipeline(SS_HTTPRequest $request) {
		$params = $request->params();
		$pipeline = Pipeline::get()->byID($params['Identifier']);

		if(!$pipeline || !$pipeline->ID || !$pipeline->Environment()) {
			throw new SS_HTTPResponse_Exception('Pipeline not found', 404);
		}
		if(!$pipeline->Environment()->canView()) {
			return Security::permissionFailure();
		}

		$environment = $pipeline->Environment();
		$project = $pipeline->Environment()->Project();

		if($environment->Name != $params['Environment']) {
			throw new LogicException("Environment in URL doesn't match this pipeline");
		}
		if($project->Name != $params['Project']) {
			throw new LogicException("Project in URL doesn't match this pipeline");
		}

		// Delegate to sub-requesthandler
		return PipelineController::create($this, $pipeline);
	}

	/**
	 * Shows the creation log.
	 *
	 * @param SS_HTTPRequest $request
	 * @return string
	 */
	public function createenv(SS_HTTPRequest $request) {
		$params = $request->params();
		if($params['Identifier']) {
			$record = DNCreateEnvironment::get()->byId($params['Identifier']);

			if(!$record || !$record->ID) {
				throw new SS_HTTPResponse_Exception('Create environment not found', 404);
			}
			if(!$record->canView()) {
				return Security::permissionFailure();
			}

			$project = $this->getCurrentProject();
			if(!$project) {
				return $this->project404Response();
			}

			if($project->Name != $params['Project']) {
				throw new LogicException("Project in URL doesn't match this creation");
			}

			return $this->render(array(
				'CreateEnvironment' => $record,
			));
		}
		return $this->render();
	}


	public function createenvlog(SS_HTTPRequest $request) {
		$this->setCurrentActionType(self::ACTION_SNAPSHOT);

		$params = $request->params();
		$env = DNCreateEnvironment::get()->byId($params['Identifier']);

		if(!$env || !$env->ID) {
			throw new SS_HTTPResponse_Exception('Log not found', 404);
		}
		if(!$env->canView()) {
			return Security::permissionFailure();
		}

		$project = $env->Project();

		if($project->Name != $params['Project']) {
			throw new LogicException("Project in URL doesn't match this deploy");
		}

		$log = $env->log();
		if($log->exists()) {
			$content = $log->content();
		} else {
			$content = 'Waiting for action to start';
		}

		return $this->sendResponse($env->ResqueStatus(), $content);
	}

	/**
	 * @param SS_HTTPRequest $request
	 * @return Form
	 */
	public function getCreateEnvironmentForm(SS_HTTPRequest $request) {
		$this->setCurrentActionType(self::ACTION_ENVIRONMENTS);

		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		$envType = $project->AllowedEnvironmentType;
		if(!$envType || !class_exists($envType)) {
			return null;
		}

		$backend = Injector::inst()->get($envType);
		if(!($backend instanceof EnvironmentCreateBackend)) {
			// Only allow this for supported backends.
			return null;
		}

		$fields = $backend->getCreateEnvironmentFields($project);
		if(!$fields) return null;

		if(!$project->canCreateEnvironments()) {
			return new SS_HTTPResponse('Not allowed to create environments for this project', 401);
		}

		$form = new Form(
			$this,
			'CreateEnvironmentForm',
			$fields,
			new FieldList(
				$action = new FormAction('doCreateEnvironment', 'Create')
			),
			$backend->getCreateEnvironmentValidator()
		);

		$action->addExtraClass('btn');
		// Tweak the action so it plays well with our fake URL structure.
		$form->setFormAction($project->Link() . '/CreateEnvironmentForm');

		return $form;
	}

	/**
	 * @param array $data
	 * @param Form $form
	 *
	 * @return bool|HTMLText|SS_HTTPResponse
	 */
	public function doCreateEnvironment($data, Form $form) {
		$this->setCurrentActionType(self::ACTION_ENVIRONMENTS);

		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		if(!$project->canCreateEnvironments()) {
			return new SS_HTTPResponse('Not allowed to create environments for this project', 401);
		}

		// Set the environment type so we know what we're creating.
		$data['EnvironmentType'] = $project->AllowedEnvironmentType;

		$job = DNCreateEnvironment::create();

		$job->Data = serialize($data);
		$job->ProjectID = $project->ID;
		$job->write();
		$job->start();

		return $this->redirect($project->Link('createenv') . '/' . $job->ID);
	}

	/**
	 *
	 * @param SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function metrics(SS_HTTPRequest $request) {
		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		// Performs canView permission check by limiting visible projects
		$env = $this->getCurrentEnvironment($project);
		if(!$env) {
			return $this->environment404Response();
		}

		return $this->render();
	}

	/**
	 * Get the DNData object.
	 *
	 * @return DNData
	 */
	public function DNData() {
		return DNData::inst();
	}

	/**
	 * Provide a list of all projects.
	 *
	 * @return SS_List
	 */
	public function DNProjectList() {
		$memberId = Member::currentUserID();
		if(!$memberId) {
			return new ArrayList();
		}

		if(Permission::check('ADMIN')) {
			return DNProject::get();
		}

		return Member::get()->filter('ID', $memberId)
			->relation('Groups')
			->relation('Projects');
	}

	/**
	 * @return ArrayList
	 */
	public function getPlatformSpecificStrings() {
		$strings = $this->config()->platform_specific_strings;
		if ($strings) {
			return new ArrayList($strings);
		}
	}

	/**
	 * Provide a list of all starred projects for the currently logged in member
	 *
	 * @return SS_List
	 */
	public function getStarredProjects() {
		$member = Member::currentUser();
		if($member === null) {
			return new ArrayList();
		}

		$favProjects = $member->StarredProjects();

		$list = new ArrayList();
		foreach($favProjects as $project) {
			if($project->canView($member)) {
				$list->add($project);
			}
		}
		return $list;
	}

	/**
	 * Returns top level navigation of projects.
	 *
	 * @param int $limit
	 *
	 * @return ArrayList
	 */
	public function Navigation($limit = 5) {
		$navigation = new ArrayList();

		$currentProject = $this->getCurrentProject();

		$projects = $this->getStarredProjects();
		if($projects->count() < 1) {
			$projects = $this->DNProjectList();
		} else {
			$limit = -1;
		}

		if($projects->count() > 0) {
			$activeProject = false;

			if($limit > 0) {
				$limitedProjects = $projects->limit($limit);
			} else {
				$limitedProjects = $projects;
			}

			foreach($limitedProjects as $project) {
				$isActive = $currentProject && $currentProject->ID == $project->ID;
				if($isActive) {
					$activeProject = true;
				}

				$navigation->push(array(
					'Project' => $project,
					'IsActive' => $currentProject && $currentProject->ID == $project->ID,
				));
			}

			// Ensure the current project is in the list
			if(!$activeProject && $currentProject) {
				$navigation->unshift(array(
					'Project' => $currentProject,
					'IsActive' => true,
				));
				if($limit > 0 && $navigation->count() > $limit) {
					$navigation->pop();
				}
			}
		}

		return $navigation;
	}

	/**
	 * Construct the deployment form
	 *
	 * @return Form
	 */
	public function getDeployForm($request = null) {

		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		// Performs canView permission check by limiting visible projects
		$environment = $this->getCurrentEnvironment($project);
		if(!$environment) {
			return $this->environment404Response();
		}

		if(!$environment->canDeploy()) {
			return new SS_HTTPResponse("Not allowed to deploy", 401);
		}

		// Generate the form
		$form = new DeployForm($this, 'DeployForm', $environment, $project);

		// If this is an ajax request we don't want to submit the form - we just want to retrieve the markup.
		if(
			$request &&
			!$request->requestVar('action_showDeploySummary') &&
			$this->getRequest()->isAjax() &&
			$this->getRequest()->isGET()
		) {
			// We can just use the URL we're accessing
			$form->setFormAction($this->getRequest()->getURL());

			$body = json_encode(array('Content' => $form->forAjaxTemplate()->forTemplate()));
			$this->getResponse()->addHeader('Content-Type', 'application/json');
			$this->getResponse()->setBody($body);
			return $body;
		}

		$form->setFormAction($this->getRequest()->getURL() . '/DeployForm');
		return $form;
	}

	/**
	 * @param SS_HTTPRequest $request
	 *
	 * @return SS_HTTPResponse|string
	 */
	public function gitRevisions(SS_HTTPRequest $request) {

		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		// Performs canView permission check by limiting visible projects
		$env = $this->getCurrentEnvironment($project);
		if(!$env) {
			return $this->environment404Response();
		}

		// For now only permit advanced options on one environment type, because we hacked the "full-deploy"
		// checkbox in. Other environments such as the fast or capistrano one wouldn't know what to do with it.
		if(get_class($env) === 'RainforestEnvironment') {
			$advanced = Permission::check('DEPLOYNAUT_ADVANCED_DEPLOY_OPTIONS') ? 'true' : 'false';
		} else {
			$advanced = 'false';
		}

		$tabs = array();
		$id = 0;
		$data = array(
			'id' => ++$id,
			'name' => 'Deploy the latest version of a branch',
			'field_type' => 'dropdown',
			'field_label' => 'Choose a branch',
			'field_id' => 'branch',
			'field_data' => array(),
			'advanced_opts' => $advanced
		);
		foreach($project->DNBranchList() as $branch) {
			$sha = $branch->SHA();
			$name = $branch->Name();
			$branchValue = sprintf("%s (%s, %s old)",
				$name,
				substr($sha, 0, 8),
				$branch->LastUpdated()->TimeDiff()
			);
			$data['field_data'][] = array(
				'id' => $sha,
				'text' => $branchValue
			);
		}
		$tabs[] = $data;

		$data = array(
			'id' => ++$id,
			'name' => 'Deploy a tagged release',
			'field_type' => 'dropdown',
			'field_label' => 'Choose a tag',
			'field_id' => 'tag',
			'field_data' => array(),
			'advanced_opts' => $advanced
		);

		foreach($project->DNTagList()->setLimit(null) as $tag) {
			$name = $tag->Name();
			$data['field_data'][] = array(
				'id' => $tag->SHA(),
				'text' => sprintf("%s", $name)
			);
		}

		// show newest tags first.
		$data['field_data'] = array_reverse($data['field_data']);

		$tabs[] = $data;

		// Past deployments
		$data = array(
			'id' => ++$id,
			'name' => 'Redeploy a release that was previously deployed (to any environment)',
			'field_type' => 'dropdown',
			'field_label' => 'Choose a previously deployed release',
			'field_id' => 'release',
			'field_data' => array(),
			'advanced_opts' => $advanced
		);
		// We are aiming at the format:
		// [{text: 'optgroup text', children: [{id: '<sha>', text: '<inner text>'}]}]
		$redeploy = array();
		foreach($project->DNEnvironmentList() as $dnEnvironment) {
			$envName = $dnEnvironment->Name;
			$perEnvDeploys = array();

			foreach($dnEnvironment->DeployHistory() as $deploy) {
				$sha = $deploy->SHA;

				// Check if exists to make sure the newest deployment date is used.
				if(!isset($perEnvDeploys[$sha])) {
					$pastValue = sprintf("%s (deployed %s)",
						substr($sha, 0, 8),
						$deploy->obj('LastEdited')->Ago()
					);
					$perEnvDeploys[$sha] = array(
						'id' => $sha,
						'text' => $pastValue
					);
				}
			}

			if(!empty($perEnvDeploys)) {
				$redeploy[$envName] = array_values($perEnvDeploys);
			}
		}
		// Convert the array to the frontend format (i.e. keyed to regular array)
		foreach($redeploy as $env => $descr) {
			$data['field_data'][] = array('text'=>$env, 'children'=>$descr);
		}
		$tabs[] = $data;

		$data = array(
			'id' => ++$id,
			'name' => 'Deploy a specific SHA',
			'field_type' => 'textfield',
			'field_label' => 'Choose a SHA',
			'field_id' => 'SHA',
			'field_data' => array(),
			'advanced_opts' => $advanced
		);
		$tabs[] = $data;

		// get the last time git fetch was run
		$lastFetched = 'never';
		$fetch = DNGitFetch::get()
			->filter('ProjectID', $project->ID)
			->sort('LastEdited', 'DESC')
			->first();
		if($fetch) {
			$lastFetched = $fetch->dbObject('LastEdited')->Ago();
		}

		$data = array(
			'Tabs' => $tabs,
			'last_fetched' => $lastFetched
		);

		return json_encode($data, JSON_PRETTY_PRINT);
	}

	/**
	 * Check and regenerate a global CSRF token
	 *
	 * @param SS_HTTPRequest $request
	 * @param bool $resetToken
	 *
	 * @return bool
	 */
	protected function checkCsrfToken(SS_HTTPRequest $request, $resetToken = true) {
		$token = SecurityToken::inst();

		// Ensure the submitted token has a value
		$submittedToken = $request->postVar('SecurityID');
		if(!$submittedToken) {
			return false;
		}

		// Do the actual check.
		$check = $token->check($submittedToken);

		// Reset the token after we've checked the existing token
		if($resetToken) {
			$token->reset();
		}

		// Return whether the token was correct or not
		return $check;
	}

	/**
	 * @param SS_HTTPRequest $request
	 *
	 * @return string
	 */
	public function deploySummary(SS_HTTPRequest $request) {

		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		// Performs canView permission check by limiting visible projects
		$environment = $this->getCurrentEnvironment($project);
		if(!$environment) {
			return $this->environment404Response();
		}

		// Plan the deployment.
		$strategy = $environment->Backend()->planDeploy(
			$environment,
			$request->requestVars()
		);
		$data = $strategy->toArray();

		// Add in a URL for comparing from->to code changes. Ensure that we have
		// two proper 40 character SHAs, otherwise we can't show the compare link.
		if(
			strlen($data['changes']['Code version']['from']) == '40'
			&& strlen($data['changes']['Code version']['to']) == '40'
		) {
			$interface = $project->getRepositoryInterface();
			$compareurl = sprintf(
				'%s/compare/%s...%s',
				$interface->URL,
				$data['changes']['Code version']['from'],
				$data['changes']['Code version']['to']
			);
			$data['changes']['Code version']['compareUrl'] = $compareurl;
		}

		// Append json to response
		$token = SecurityToken::inst();
		$data['SecurityID'] = $token->getValue();

		return json_encode($data);
	}

	/**
	 * Deployment form submission handler.
	 *
	 * Initiate a DNDeployment record and redirect to it for status polling
	 *
	 * @param SS_HTTPRequest $request
	 *
	 * @return SS_HTTPResponse
	 * @throws ValidationException
	 * @throws null
	 */
	public function startDeploy(SS_HTTPRequest $request) {

		// Ensure the CSRF Token is correct
		if(!$this->checkCsrfToken($request)) {
			// CSRF token didn't match
			return $this->httpError(400, 'Bad Request');
		}

		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		// Performs canView permission check by limiting visible projects
		$environment = $this->getCurrentEnvironment($project);
		if(!$environment) {
			return $this->environment404Response();
		}

		// Initiate the deployment
		// The extension point should pass in: Project, Environment, SelectRelease, buildName
		$this->extend('doDeploy', $project, $environment, $buildName, $data);

		// Start the deployment based on the approved strategy.
		$strategy = new DeploymentStrategy($environment);
		$strategy->fromArray($request->requestVar('strategy'));
		$deployment = $strategy->createDeployment();
		$deployment->start();

		return json_encode(array(
			'url' => Director::absoluteBaseURL() . $deployment->Link()
		), JSON_PRETTY_PRINT);
	}

	/**
	 * Action - Do the actual deploy
	 *
	 * @param SS_HTTPRequest $request
	 *
	 * @return SS_HTTPResponse|string
	 * @throws SS_HTTPResponse_Exception
	 */
	public function deploy(SS_HTTPRequest $request) {
		$params = $request->params();
		$deployment = DNDeployment::get()->byId($params['Identifier']);

		if(!$deployment || !$deployment->ID) {
			throw new SS_HTTPResponse_Exception('Deployment not found', 404);
		}
		if(!$deployment->canView()) {
			return Security::permissionFailure();
		}

		$environment = $deployment->Environment();
		$project = $environment->Project();

		if($environment->Name != $params['Environment']) {
			throw new LogicException("Environment in URL doesn't match this deploy");
		}
		if($project->Name != $params['Project']) {
			throw new LogicException("Project in URL doesn't match this deploy");
		}

		return $this->render(array(
			'Deployment' => $deployment,
		));
	}


	/**
	 * Action - Get the latest deploy log
	 *
	 * @param SS_HTTPRequest $request
	 *
	 * @return string
	 * @throws SS_HTTPResponse_Exception
	 */
	public function deploylog(SS_HTTPRequest $request) {
		$params = $request->params();
		$deployment = DNDeployment::get()->byId($params['Identifier']);

		if(!$deployment || !$deployment->ID) {
			throw new SS_HTTPResponse_Exception('Deployment not found', 404);
		}
		if(!$deployment->canView()) {
			return Security::permissionFailure();
		}

		$environment = $deployment->Environment();
		$project = $environment->Project();

		if($environment->Name != $params['Environment']) {
			throw new LogicException("Environment in URL doesn't match this deploy");
		}
		if($project->Name != $params['Project']) {
			throw new LogicException("Project in URL doesn't match this deploy");
		}

		$log = $deployment->log();
		if($log->exists()) {
			$content = $log->content();
		} else {
			$content = 'Waiting for action to start';
		}

		return $this->sendResponse($deployment->ResqueStatus(), $content);
	}

	/**
	 * @param SS_HTTPRequest|null $request
	 *
	 * @return Form
	 */
	public function getDataTransferForm(SS_HTTPRequest $request = null) {
		// Performs canView permission check by limiting visible projects
		$envs = $this->getCurrentProject()->DNEnvironmentList()->filterByCallback(function($item) {
			return $item->canBackup();
		});

		if(!$envs) {
			return $this->environment404Response();
		}

		$form = new Form(
			$this,
			'DataTransferForm',
			new FieldList(
				new HiddenField('Direction', null, 'get'),
				new DropdownField('EnvironmentID', 'Environment', $envs->map()),
				new DropdownField('Mode', 'Transfer', DNDataArchive::get_mode_map())
			),
			new FieldList(
				FormAction::create('doDataTransfer', 'Create')->addExtraClass('btn')
			)
		);
		$form->setFormAction($this->getRequest()->getURL() . '/DataTransferForm');

		return $form;
	}

	/**
	 * @param array $data
	 * @param Form $form
	 *
	 * @return SS_HTTPResponse
	 * @throws SS_HTTPResponse_Exception
	 */
	public function doDataTransfer($data, Form $form) {
		$this->setCurrentActionType(self::ACTION_SNAPSHOT);

		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		$dataArchive = null;

		// Validate direction.
		if($data['Direction'] == 'get') {
			$validEnvs = $this->getCurrentProject()->DNEnvironmentList()
				->filterByCallback(function($item) {
					return $item->canBackup();
				});
		} else if($data['Direction'] == 'push') {
			$validEnvs = $this->getCurrentProject()->DNEnvironmentList()
				->filterByCallback(function($item) {
					return $item->canRestore();
				});
		} else {
			throw new LogicException('Invalid direction');
		}

		// Validate $data['EnvironmentID'] by checking against $validEnvs.
		$environment = $validEnvs->find('ID', $data['EnvironmentID']);
		if(!$environment) {
			throw new LogicException('Invalid environment');
		}

		$this->validateSnapshotMode($data['Mode']);


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

			if(!$dataArchive->canDownload()) {
				throw new SS_HTTPResponse_Exception('Not allowed to access archive', 403);
			}
		}

		$transfer = DNDataTransfer::create();
		$transfer->EnvironmentID = $environment->ID;
		$transfer->Direction = $data['Direction'];
		$transfer->Mode = $data['Mode'];
		$transfer->DataArchiveID = $dataArchive ? $dataArchive->ID : null;
		if($data['Direction'] == 'push') {
			$transfer->setBackupBeforePush(!empty($data['BackupBeforePush']));
		}
		$transfer->write();
		$transfer->start();

		return $this->redirect($transfer->Link());
	}

	/**
	 * View into the log for a {@link DNDataTransfer}.
	 *
	 * @param SS_HTTPRequest $request
	 *
	 * @return SS_HTTPResponse|string
	 * @throws SS_HTTPResponse_Exception
	 */
	public function transfer(SS_HTTPRequest $request) {
		$this->setCurrentActionType(self::ACTION_SNAPSHOT);

		$params = $request->params();
		$transfer = DNDataTransfer::get()->byId($params['Identifier']);

		if(!$transfer || !$transfer->ID) {
			throw new SS_HTTPResponse_Exception('Transfer not found', 404);
		}
		if(!$transfer->canView()) {
			return Security::permissionFailure();
		}

		$environment = $transfer->Environment();
		$project = $environment->Project();

		if($project->Name != $params['Project']) {
			throw new LogicException("Project in URL doesn't match this deploy");
		}

		return $this->render(array(
			'CurrentTransfer' => $transfer,
			'SnapshotsSection' => 1,
		));
	}

	/**
	 * Action - Get the latest deploy log
	 *
	 * @param SS_HTTPRequest $request
	 *
	 * @return string
	 * @throws SS_HTTPResponse_Exception
	 */
	public function transferlog(SS_HTTPRequest $request) {
		$this->setCurrentActionType(self::ACTION_SNAPSHOT);

		$params = $request->params();
		$transfer = DNDataTransfer::get()->byId($params['Identifier']);

		if(!$transfer || !$transfer->ID) {
			throw new SS_HTTPResponse_Exception('Transfer not found', 404);
		}
		if(!$transfer->canView()) {
			return Security::permissionFailure();
		}

		$environment = $transfer->Environment();
		$project = $environment->Project();

		if($project->Name != $params['Project']) {
			throw new LogicException("Project in URL doesn't match this deploy");
		}

		$log = $transfer->log();
		if($log->exists()) {
			$content = $log->content();
		} else {
			$content = 'Waiting for action to start';
		}

		return $this->sendResponse($transfer->ResqueStatus(), $content);
	}

	/**
	 * Note: Submits to the same action as {@link getDataTransferForm()},
	 * but with a Direction=push and an archive reference.
	 *
	 * @param SS_HTTPRequest $request
	 * @param DNDataArchive|null $dataArchive Only set when method is called manually in {@link restore()},
	 *                            otherwise the state is inferred from the request data.
	 * @return Form
	 */
	public function getDataTransferRestoreForm(SS_HTTPRequest $request, DNDataArchive $dataArchive = null) {
		$dataArchive = $dataArchive ? $dataArchive : DNDataArchive::get()->byId($request->requestVar('DataArchiveID'));

		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		$envs = $project->DNEnvironmentList()->filterByCallback(function($item) {
			return $item->canRestore();
		});

		if(!$envs) {
			return $this->environment404Response();
		}

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

		$alertMessage = '<div class="alert alert-warning"><strong>Warning:</strong> '
			. 'This restore will overwrite the data on the chosen environment below</div>';
		$form = new Form(
			$this,
			'DataTransferRestoreForm',
			new FieldList(
				new HiddenField('DataArchiveID', null, $dataArchive->ID),
				new HiddenField('Direction', null, 'push'),
				new LiteralField('Warning', $alertMessage),
				new DropdownField('EnvironmentID', 'Environment', $envs->map()),
				new DropdownField('Mode', 'Transfer', $modesMap),
				new CheckboxField('BackupBeforePush', 'Backup existing data', '1')
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
	 *
	 * @param SS_HTTPRequest $request
	 *
	 * @return HTMLText
	 * @throws SS_HTTPResponse_Exception
	 */
	public function restoresnapshot(SS_HTTPRequest $request) {
		$this->setCurrentActionType(self::ACTION_SNAPSHOT);

		/** @var DNDataArchive $dataArchive */
		$dataArchive = DNDataArchive::get()->byId($request->param('DataArchiveID'));

		if(!$dataArchive) {
			throw new SS_HTTPResponse_Exception('Archive not found', 404);
		}

		// We check for canDownload because that implies access to the data.
		// canRestore is later checked on the actual restore action per environment.
		if(!$dataArchive->canDownload()) {
			throw new SS_HTTPResponse_Exception('Not allowed to access archive', 403);
		}

		$form = $this->getDataTransferRestoreForm($this->request, $dataArchive);

		// View currently only available via ajax
		return $form->forTemplate();
	}

	/**
	 * View a form to delete a specific {@link DataArchive}.
	 * Permission checks are handled in {@link DataArchives()}.
	 * Submissions are handled through {@link doDelete()}.
	 *
	 * @param SS_HTTPRequest $request
	 *
	 * @return HTMLText
	 * @throws SS_HTTPResponse_Exception
	 */
	public function deletesnapshot(SS_HTTPRequest $request) {
		$this->setCurrentActionType(self::ACTION_SNAPSHOT);

		/** @var DNDataArchive $dataArchive */
		$dataArchive = DNDataArchive::get()->byId($request->param('DataArchiveID'));

		if(!$dataArchive) {
			throw new SS_HTTPResponse_Exception('Archive not found', 404);
		}

		if(!$dataArchive->canDelete()) {
			throw new SS_HTTPResponse_Exception('Not allowed to delete archive', 403);
		}

		$form = $this->getDeleteForm($this->request, $dataArchive);

		// View currently only available via ajax
		return $form->forTemplate();
	}

	/**
	 * @param SS_HTTPRequest $request
	 * @param DNDataArchive|null $dataArchive Only set when method is called manually, otherwise the state is inferred
	 *        from the request data.
	 * @return Form
	 */
	public function getDeleteForm(SS_HTTPRequest $request, DNDataArchive $dataArchive = null) {
		$dataArchive = $dataArchive ? $dataArchive : DNDataArchive::get()->byId($request->requestVar('DataArchiveID'));

		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		$snapshotDeleteWarning = '<div class="alert alert-warning">'
			. 'Are you sure you want to permanently delete this snapshot from this archive area?'
			. '</div>';

		$form = new Form(
			$this,
			'DeleteForm',
			new FieldList(
				new HiddenField('DataArchiveID', null, $dataArchive->ID),
				new LiteralField('Warning', $snapshotDeleteWarning)
			),
			new FieldList(
				FormAction::create('doDelete', 'Delete')->addExtraClass('btn')
			)
		);
		$form->setFormAction($project->Link() . '/DeleteForm');

		return $form;
	}

	/**
	 * @param array $data
	 * @param Form $form
	 *
	 * @return bool|SS_HTTPResponse
	 * @throws SS_HTTPResponse_Exception
	 */
	public function doDelete($data, Form $form) {
		$this->setCurrentActionType(self::ACTION_SNAPSHOT);

		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		$dataArchive = null;

		if(
			isset($data['DataArchiveID'])
			&& is_numeric($data['DataArchiveID'])
		) {
			$dataArchive = DNDataArchive::get()->byId($data['DataArchiveID']);
		}

		if(!$dataArchive) {
			throw new LogicException('Invalid data archive');
		}

		if(!$dataArchive->canDelete()) {
			throw new SS_HTTPResponse_Exception('Not allowed to delete archive', 403);
		}

		$dataArchive->delete();

		return $this->redirectBack();
	}

	/**
	 * View a form to move a specific {@link DataArchive}.
	 *
	 * @param SS_HTTPRequest $request
	 *
	 * @return HTMLText
	 * @throws SS_HTTPResponse_Exception
	 */
	public function movesnapshot(SS_HTTPRequest $request) {
		$this->setCurrentActionType(self::ACTION_SNAPSHOT);

		/** @var DNDataArchive $dataArchive */
		$dataArchive = DNDataArchive::get()->byId($request->param('DataArchiveID'));

		if(!$dataArchive) {
			throw new SS_HTTPResponse_Exception('Archive not found', 404);
		}

		// We check for canDownload because that implies access to the data.
		if(!$dataArchive->canDownload()) {
			throw new SS_HTTPResponse_Exception('Not allowed to access archive', 403);
		}

		$form = $this->getMoveForm($this->request, $dataArchive);

		// View currently only available via ajax
		return $form->forTemplate();
	}

	/**
	 * Build snapshot move form.
	 *
	 * @param SS_HTTPRequest $request
	 * @param DNDataArchive|null $dataArchive
	 *
	 * @return Form|SS_HTTPResponse
	 */
	public function getMoveForm(SS_HTTPRequest $request, DNDataArchive $dataArchive = null) {
		$dataArchive = $dataArchive ? $dataArchive : DNDataArchive::get()->byId($request->requestVar('DataArchiveID'));

		$envs = $dataArchive->validTargetEnvironments();
		if(!$envs) {
			return $this->environment404Response();
		}

		$warningMessage = '<div class="alert alert-warning"><strong>Warning:</strong> This will make the snapshot '
			. 'available to people with access to the target environment.<br>By pressing "Change ownership" you '
			. 'confirm that you have considered data confidentiality regulations.</div>';
		$form = new Form(
			$this,
			'MoveForm',
			new FieldList(
				new HiddenField('DataArchiveID', null, $dataArchive->ID),
				new LiteralField('Warning', $warningMessage),
				new DropdownField('EnvironmentID', 'Environment', $envs->map())
			),
			new FieldList(
				FormAction::create('doMove', 'Change ownership')->addExtraClass('btn')
			)
		);
		$form->setFormAction($this->getCurrentProject()->Link() . '/MoveForm');

		return $form;
	}

	/**
	 * @param array $data
	 * @param Form $form
	 *
	 * @return bool|SS_HTTPResponse
	 * @throws SS_HTTPResponse_Exception
	 * @throws ValidationException
	 * @throws null
	 */
	public function doMove($data, Form $form) {
		$this->setCurrentActionType(self::ACTION_SNAPSHOT);

		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		/** @var DNDataArchive $dataArchive */
		$dataArchive = DNDataArchive::get()->byId($data['DataArchiveID']);
		if(!$dataArchive) {
			throw new LogicException('Invalid data archive');
		}

		// We check for canDownload because that implies access to the data.
		if(!$dataArchive->canDownload()) {
			throw new SS_HTTPResponse_Exception('Not allowed to access archive', 403);
		}

		// Validate $data['EnvironmentID'] by checking against $validEnvs.
		$validEnvs = $dataArchive->validTargetEnvironments();
		$environment = $validEnvs->find('ID', $data['EnvironmentID']);
		if(!$environment) {
			throw new LogicException('Invalid environment');
		}

		$dataArchive->EnvironmentID = $environment->ID;
		$dataArchive->write();

		return $this->redirectBack();
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
	 * @return array
	 */
	public function providePermissions() {
		return array(
			self::DEPLOYNAUT_BYPASS_PIPELINE => array(
				'name' => "Bypass Pipeline",
				'category' => "Deploynaut",
				'help' => "Enables users to directly initiate deployments, bypassing any pipeline",
			),
			self::DEPLOYNAUT_DRYRUN_PIPELINE => array(
				'name' => 'Dry-run Pipeline',
				'category' => 'Deploynaut',
				'help' => 'Enable dry-run execution of pipelines for testing'
			),
			self::DEPLOYNAUT_ADVANCED_DEPLOY_OPTIONS => array(
				'name' => "Access to advanced deploy options",
				'category' => "Deploynaut",
			),

			// Permissions that are intended to be added to the roles.
			self::ALLOW_PROD_DEPLOYMENT => array(
				'name' => "Ability to deploy to production environments",
				'category' => "Deploynaut",
			),
			self::ALLOW_NON_PROD_DEPLOYMENT => array(
				'name' => "Ability to deploy to non-production environments",
				'category' => "Deploynaut",
			),
			self::ALLOW_PROD_SNAPSHOT => array(
				'name' => "Ability to make production snapshots",
				'category' => "Deploynaut",
			),
			self::ALLOW_NON_PROD_SNAPSHOT => array(
				'name' => "Ability to make non-production snapshots",
				'category' => "Deploynaut",
			),
			self::ALLOW_CREATE_ENVIRONMENT => array(
				'name' => "Ability to create environments",
				'category' => "Deploynaut",
			),
		);
	}

	/**
	 * @return DNProject|null
	 */
	public function getCurrentProject() {
		$projectName = trim($this->getRequest()->param('Project'));
		if(!$projectName) {
			return null;
		}
		if(empty(self::$_project_cache[$projectName])) {
			self::$_project_cache[$projectName] = $this->DNProjectList()->filter('Name', $projectName)->First();
		}
		return self::$_project_cache[$projectName];
	}

	/**
	 * @param DNProject|null $project
	 * @return DNEnvironment|null
	 */
	public function getCurrentEnvironment(DNProject $project = null) {
		if($this->getRequest()->param('Environment') === null) {
			return null;
		}
		if($project === null) {
			$project = $this->getCurrentProject();
		}
		// project can still be null
		if($project === null) {
			return null;
		}
		return $project->DNEnvironmentList()->filter('Name', $this->getRequest()->param('Environment'))->First();
	}

	/**
	 * This will return a const that indicates the class of action currently being performed
	 *
	 * Until DNRoot is de-godded, it does a bunch of different actions all in the same class.
	 * So we just have each action handler calll setCurrentActionType to define what sort of
	 * action it is.
	 *
	 * @return string - one of the consts from self::$action_types
	 */
	public function getCurrentActionType() {
		return $this->actionType;
	}

	/**
	 * Sets the current action type
	 *
	 * @param string $actionType string - one of the consts from self::$action_types
	 */
	public function setCurrentActionType($actionType) {
		$this->actionType = $actionType;
	}

	/**
	 * Helper method to allow templates to know whether they should show the 'Archive List' include or not.
	 * The actual permissions are set on a per-environment level, so we need to find out if this $member can upload to
	 * or download from *any* {@link DNEnvironment} that (s)he has access to.
	 *
	 * TODO To be replaced with a method that just returns the list of archives this {@link Member} has access to.
	 *
	 * @param Member|null $member The {@link Member} to check (or null to check the currently logged in Member)
	 * @return boolean|null true if $member has access to upload or download to at least one {@link DNEnvironment}.
	 */
	public function CanViewArchives(Member $member = null) {
		if($member === null) {
			$member = Member::currentUser();
		}

		if(Permission::checkMember($member, 'ADMIN')) {
			return true;
		}

		$allProjects = $this->DNProjectList();
		if(!$allProjects) {
			return false;
		}

		foreach($allProjects as $project) {
			if($project->Environments()) {
				foreach($project->Environments() as $environment) {
					if(
						$environment->canRestore($member) ||
						$environment->canBackup($member) ||
						$environment->canUploadArchive($member) ||
						$environment->canDownloadArchive($member)
					) {
						// We can return early as we only need to know that we can access one environment
						return true;
					}
				}
			}
		}
	}

	/**
	 * Returns a list of attempted environment creations.
	 *
	 * @return PaginatedList
	 */
	public function CreateEnvironmentList() {
		$project = $this->getCurrentProject();
		if($project) {
			return new PaginatedList($project->CreateEnvironments()->sort("Created DESC"), $this->request);
		}
		return new PaginatedList(new ArrayList(), $this->request);
	}

	/**
	 * Returns a list of all archive files that can be accessed by the currently logged-in {@link Member}
	 *
	 * @return PaginatedList
	 */
	public function CompleteDataArchives() {
		$project = $this->getCurrentProject();
		$archives = new ArrayList();

		$archiveList = $project->Environments()->relation("DataArchives");
		if($archiveList->count() > 0) {
			foreach($archiveList as $archive) {
				if($archive->canView() && !$archive->isPending()) {
					$archives->push($archive);
				}
			}
		}
		return new PaginatedList($archives->sort("Created", "DESC"), $this->request);
	}

	/**
	 * @return PaginatedList The list of "pending" data archives which are waiting for a file
	 * to be delivered offline by post, and manually uploaded into the system.
	 */
	public function PendingDataArchives() {
		$project = $this->getCurrentProject();
		$archives = new ArrayList();
		foreach($project->DNEnvironmentList() as $env) {
			foreach($env->DataArchives() as $archive) {
				if($archive->canView() && $archive->isPending()) {
					$archives->push($archive);
				}
			}
		}
		return new PaginatedList($archives->sort("Created", "DESC"), $this->request);
	}

	/**
	 * @return PaginatedList
	 */
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

	/**
	 * @return null|PaginatedList
	 */
	public function DeployHistory() {
		if($env = $this->getCurrentEnvironment()) {
			$history = $env->DeployHistory();
			if($history->count() > 0) {
				$pagination = new PaginatedList($history, $this->getRequest());
				$pagination->setPageLength(8);
				return $pagination;
			}
		}
		return null;
	}

	/**
	 * @return SS_HTTPResponse
	 */
	protected function project404Response() {
		return new SS_HTTPResponse(
			"Project '" . Convert::raw2xml($this->getRequest()->param('Project')) . "' not found.",
			404
		);
	}

	/**
	 * @return SS_HTTPResponse
	 */
	protected function environment404Response() {
		$envName = Convert::raw2xml($this->getRequest()->param('Environment'));
		return new SS_HTTPResponse("Environment '" . $envName . "' not found.", 404);
	}

	/**
	 * @param string $status
	 * @param string $content
	 *
	 * @return string
	 */
	protected function sendResponse($status, $content) {
		// strip excessive newlines
		$content = preg_replace('/(?:(?:\r\n|\r|\n)\s*){2}/s', "\n", $content);

		$sendJSON = (strpos($this->getRequest()->getHeader('Accept'), 'application/json') !== false)
			|| $this->getRequest()->getExtension() == 'json';

		if(!$sendJSON) {
			$this->response->addHeader("Content-type", "text/plain");
			return $content;
		}
		$this->response->addHeader("Content-type", "application/json");
		return json_encode(array(
			'status' => $status,
			'content' => $content,
		));
	}

	/**
	 * Validate the snapshot mode
	 *
	 * @param string $mode
	 */
	protected function validateSnapshotMode($mode) {
		if(!in_array($mode, array('all', 'assets', 'db'))) {
			throw new LogicException('Invalid mode');
		}
	}

	/**
	 * @param string $sectionName
	 * @param string $title
	 *
	 * @return SS_HTTPResponse
	 */
	protected function getCustomisedViewSection($sectionName, $title = '') {
		// Performs canView permission check by limiting visible projects
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}
		$data = array(
			$sectionName => 1,
		);

		if($this !== '') {
			$data['Title'] = $title;
		}

		return $this->customise($data)->render();
	}

	/**
	 * Get items for the ambient menu that should be accessible from all pages.
	 *
	 * @return ArrayList
	 */
	public function AmbientMenu() {
		$list = new ArrayList();

		if (Member::currentUserID()) {
			$list->push(new ArrayData(array(
				'FaIcon' => 'sign-out',
				'Link' => 'Security/logout',
				'Title' => 'Log out',
				'IsCurrent' => false,
				'IsSection' => false
			)));
		}

		$this->extend('updateAmbientMenu', $list);
		return $list;
	}

}
