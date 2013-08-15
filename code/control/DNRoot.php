<?php

class DNRoot extends Controller implements PermissionProvider, TemplateGlobalProvider {

	static $allowed_actions = array(
		'projects',
		'update',
		'project',
		'environment',
		'metrics',
		'getDeployForm',
		'deploy',
		'deploylog',
	);

	/**
	 * URL handlers pretending that we have a deep URL structure.
	 */
	static $url_handlers = array(
		'project/$Project/environment/$Environment/DeployForm' => 'getDeployForm',
		'project/$Project/environment/$Environment/metrics' => 'metrics',
		'project/$Project/environment/$Environment/deploy/$Identifier/log' => 'deploylog',
		'project/$Project/environment/$Environment/deploy/$Identifier' => 'deploy',
		'project/$Project/environment/$Environment' => 'environment',
		'project/$Project/build/$Build' => 'build',
		'project/$Project/update' => 'update',
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
	 * Actions.
	 */
	public function index() {
		return $this->redirect($this->Link() . 'projects/');
	}

	public function projects() {
		return $this->customise(array('Title' => 'Projects'))->renderWith(array('DNRoot_projects', 'DNRoot'));
	}

	/**
	 * Updates (fetches) the latest changes from the git origin
	 *
	 * @return \SS_HTTPResponse
	 */
	public function update(SS_HTTPRequest $request) {
		$project = $this->DNProjectList()->filter('Name', $request->latestParam('Project'))->First();
		if(!$project) {
			return new SS_HTTPResponse("Project '" . $request->latestParam('Project') . "' not found.", 404);
		}
		$repository = new Gitonomy\Git\Repository($project->LocalCVSPath, array(
			'environment_variables' => $project->getProcessEnv()
		));
		$repository->run('fetch', array('-p', 'origin', '+refs/heads/*:refs/heads/*', '--tags'));
		return true;
	}

	public function project($request) {
		$project = $this->DNProjectList()->filter('Name', $request->latestParam('Project'))->First();
		if(!$project) {
			return new SS_HTTPResponse("Project '" . $request->latestParam('Project') . "' not found.", 404);
		}
		return $project->renderWith(array('DNRoot_project', 'DNRoot'));
	}

	public function environment($request) {
		$project = $this->DNProjectList()->filter('Name', $request->latestParam('Project'))->First();
		if(!$project) {
			return new SS_HTTPResponse("Project '" . $request->latestParam('Project') . "' not found.", 404);
		}

		$env = $project->DNEnvironmentList()->filter('Name', $request->latestParam('Environment'))->First();
		if(!$env) {
			return new SS_HTTPResponse("Environment '" . $request->latestParam('Environment') . "' not found.", 404);
		}

		return $env->customise(array(
			'DeployForm' => $this->getDeployForm($request)			
		))->renderWith(array('DNRoot_environment', 'DNRoot'));
	}

	public function metrics($request) {
		$project = $this->DNProjectList()->filter('Name', $request->latestParam('Project'))->First();
		if(!$project) {
			return new SS_HTTPResponse("Project '" . $request->latestParam('Project') . "' not found.", 404);
		}

		$env = $project->DNEnvironmentList()->filter('Name', $request->latestParam('Environment'))->First();
		if(!$env) {
			return new SS_HTTPResponse("Environment '" . $request->latestParam('Environment') . "' not found.", 404);
		}

		return $env->renderWith(array('DNRoot_metrics', 'DNRoot'));
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
	 */
	public function DNProjectList() {
		return DataObject::get('DNProject')->filterByCallback(function($record) {
			return $record->canView();
		});
	}

	/**
	 * Construct the deployment form.
	 */
	public function getDeployForm($request) {
		$project = $this->DNProjectList()->filter('Name', $request->latestParam('Project'))->First();
		$environment = $project->DNEnvironmentList()->filter('Name', $request->latestParam('Environment'))->First();

		if(!$environment->canDeploy()) return null;

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
			$redeploy[$envName] = array();
			foreach($dnEnvironment->DeployHistory() as $deploy) {
				$sha = $deploy->BuildName;
				if(!isset($redeploy[$envName][$sha])) {
					$redeploy[$envName][$sha] = substr($sha,0,8) . ' (deployed ' . $deploy->DateTime->Ago() . ')';
				}
			}
		}


		$releaseMethods = array(
			new SelectionGroup_Item(
				'Tag',
				new DropdownField('Tag', '', $tags),
				'Deploy a tagged release'
			),
			new SelectionGroup_Item(
				'Branch',
				new DropdownField('Branch', '', $branches),
				'Deploy the latest version of a branch'
			),
			new SelectionGroup_Item(
				'Redeploy',
				new GroupedDropdownField('Redeploy', '', $redeploy),
				'Redeploy a release that was previously deployed (to any environment)'
			),
			new SelectionGroup_Item(
				'SHA',
				new Textfield('SHA', 'Please specify the full SHA'),
				'Deploy a specific SHA'
			),
		);
		 
	 	$field = new SelectionGroup('SelectRelease', $releaseMethods);
	 	$field->setValue('Tag');
	 

		//new GroupedDropdownField("BuildName", "Build", $branches)
		
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
	 */
	public function doDeploy($data, $form) {
		if(in_array($data['SelectRelease'], array('Tag','Branch','Redeploy','SHA'))) {
			$buildName = $data[$data['SelectRelease']];
		} else {
			throw new LogicException("Bad release selection method '{$data['SelectRelease']}'");
		}

		$project = $this->DNProjectList()->filter('Name', $form->request->latestParam('Project'))->First();
		$environment = $project->DNEnvironmentList()->filter('Name', $form->request->latestParam('Environment'))->First();
		$sha = $project->DNBuildList()->byName($buildName);

		$d = new DNDeployment;
		$d->EnvironmentID = $environment->ID;
		$d->SHA = $sha->FullName();
		$d->write();
		$d->start();

		$this->redirect($d->Link());
	}
	
	/**
	 * Do the actual deploy
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
			'Environment' => $environment->Name,
			'Project' => $project->Name,
			'Sha' => $deployment->SHA,
			'LogLink' => Controller::join_links($deployment->Link(),'log'),
			'LogContent' => $deployment->log()->content(),

		)))->renderWith('DNRoot_deploy');
	}
	
	/**
	 * Get the latest deploy log
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

		$this->response->addHeader("Content-type", "text/plain");

		if($log->exists()) {
			return $log->content();
		} else {
			return 'Waiting for deployment to start';
		}
	}

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
}
