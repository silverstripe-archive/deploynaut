<?php

class DNRoot extends Controller {
	/**
	 * URL handlers pretending that we have a deep URL structure.
	 */
	static $url_handlers = array(
		'project/$Project/environment/$Environment/DeployForm' => 'getDeployForm',
		'project/$Project/environment/$Environment' => 'environment',
		'project/$Project/build/$Build' => 'build',
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
		Requirements::combine_files(
			'deploynaut.js',
			array(
				THIRDPARTY_DIR . '/jquery/jquery.js',
				'themes/deploynaut/javascript/bootstrap.js',
				'themes/deploynaut/javascript/deploynaut.js',
				
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
		return $this->renderWith(array('DNRoot_projects', 'DNRoot'));
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

		$buildList = array('' => '(Choose a build)');
		foreach($project->DNBuildList() as $build) {
			$buildList[$build->FullName()] = $build->Name();
		}
		
		$form = new Form($this, 'DeployForm', new FieldList(
			new DropdownField("BuildName", "Build", $buildList)
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
	 */
	public function doDeploy($data, $form) {
		$project = $this->DNProjectList()->filter('Name', $form->request->latestParam('Project'))->First();
		$environment = $project->DNEnvironmentList()->filter('Name', $form->request->latestParam('Environment'))->First();
		$build = $project->DNBuildList()->byName($data['BuildName']);
		
		return $this->customise(new ArrayData(array(
			'Project' => $project,
			'EnvironmentName' => $environment->Name,
			'BuildFullName' => $build->FullName(),
			'BuildFileName' => $build->Filename(),
			'LogFile' => $project->Name.'.'.$environment->Name.'.'.$build->Name().'.'.time().'.log',
		)))->renderWith('DNRoot_deploy');
	}
	
	/**
	 * Do the actual deploy
	 *
	 * @param SS_HTTPRequest $request 
	 */
	public function deploy(SS_HTTPRequest $request) {
		$this->DNData()->Backend()->deploy(
			$envName = $request->postVar('EnvironmentName'), 
			$request->postVar('BuildFullName'),
			$request->postVar('BuildFileName'),
			$request->postVar('LogFile'),
			$this->DNData()->DNProjectList()->filter('Name', strtok($envName, ":"))->First()
		);
	}
	
	/**
	 * Get the latest deploy log
	 *
	 * @return string
	 */
	public function getlog(SS_HTTPRequest $request) {
		
		$logFile = $request->getVar('logfile');
		
		if(!file_exists(ASSETS_PATH . DIRECTORY_SEPARATOR . $logFile )) {
			echo 'Waiting for deployment to start';
			return;
		}
		
		$lines = file(ASSETS_PATH . DIRECTORY_SEPARATOR . $logFile );
		foreach($lines as $line) {
			echo $line;
		}
	}
	
	/**
	 * For template 
	 */
	public function RedisUnavailable() {
		return SSResqueHealthCheck::redis_unavailable();
	}
	
	public function RedisWorkersCount() {
		return SSResqueHealthCheck::workers_count();
	}
}
