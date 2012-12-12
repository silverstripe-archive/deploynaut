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
		$project = $this->DNProjectList()->byName($request->latestParam('Project'));
		return $project->renderWith(array('DNRoot_project', 'DNRoot'));
	}

	public function environment($request) {
		$project = $this->DNProjectList()->byName($request->latestParam('Project'));
		$env = $project->DNEnvironmentList()->byName($request->latestParam('Environment'));
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
		if(!$this->data) $this->data = new DNData(
			new CapistranoDeploymentBackend()
		);
		return $this->data;
	}

	/**
	 * Provide DNProjectList (with all projects enumerated within).
	 */
	public function DNProjectList() {
		return $this->DNData()->DNProjectList();
	}

	/**
	 * Construct the deployment form.
	 */
	public function getDeployForm($request) {
		$project = $this->DNProjectList()->byName($request->latestParam('Project'));
		$environment = $project->DNEnvironmentList()->byName($request->latestParam('Environment'));

		$buildList = array('' => '(Choose a build)');
		foreach($project->DNBuildList() as $build) {
			$buildList[$build->FullName()] = $build->Name();
		}
		
		$form = new Form($this, 'DeployForm', new FieldList(
			new DropdownField("BuildName", "Build", $buildList)
		), new FieldList(
			$deployAction = new FormAction('doDeploy', "Deploy to " . $environment->Name())
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
		$project = $this->DNProjectList()->byName($form->request->latestParam('Project'));
		$environment = $project->DNEnvironmentList()->byName($form->request->latestParam('Environment'));
		$build = $project->DNBuildList()->byName($data['BuildName']);
		
		return $this->customise(new ArrayData(array(
			'Project' => $project,
			'EnvironmentName' => $environment->Name(),
			'BuildFullName' => $build->FullName(),
			'BuildFileName' => $build->Filename(),
			'LogFile' => $project->Name.'.'.$environment->Name().'.'.$build->Name().'.'.time().'.log',
		)))->renderWith('DNRoot_deploy');
	}
	
	/**
	 * Do the actual deploy
	 *
	 * @param SS_HTTPRequest $request 
	 */
	public function deploy(SS_HTTPRequest $request) {
		$this->DNData()->Backend()->deploy(
			$request->postVar('EnvironmentName'), 
			$request->postVar('BuildFullName'),
			$request->postVar('BuildFileName'),
			$request->postVar('LogFile')
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
