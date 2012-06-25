<?php

class DNRoot extends Controller {
	protected $data;
	
	
	public function init() {
		parent::init();
		Requirements::javascript('sapphire/thirdparty/jquery/jquery.js');
		Requirements::javascript('themes/deploynaut/javascript/deploynaut.js');
	}
	
	public function Link() {
		return "naut/";
	}
	
	public function index() {
		return $this->redirect($this->Link() . 'builds');
	}

	public function DNData() {
		if(!$this->data) $this->data = new DNData(BASE_PATH . "/builds", array(
			"idp_dojo", "dojo", "staging", "live"
		), new CapistranoDeploymentBackend());
		return $this->data;
	}
	
	public function DNBuilds() {
		return $this->DNData()->DNBuildList();
	}
	
	public function DNEnvironments() {
		return $this->DNData()->DNEnvironmentList();
	}
	
	public function environment() {
		$env = $this->DNData()->DNEnvironmentList()->byName($this->urlParams['ID']);
		return array(
			"DNEnvironment" => $env,
			"DeployForm" => $this->getDeployForm($env->Name()),
		);
	}

	public function build() {
		return array(
			"DNBuild" => $this->DNData()->DNBuildList()->byName($this->urlParams['ID']),
		);
	}
	
	public function getDeployForm($environmentName) {
		$buildList = array('' => '(Choose a build)');
		foreach($this->DNData()->DNBuildList() as $build) {
			$buildList[$build->FullName()] = $build->Name();
		}
		
		$form = new Form($this, 'DeployForm', new FieldList(
			new HiddenField('EnvironmentName', '', $environmentName),
			new DropdownField("BuildName", "Build", $buildList)
		), new FieldList(
			new FormAction('doDeploy', "Deploy to " . $environmentName)
		));
		$form->disableSecurityToken();
		return $form;
	}
	
	public function DeployForm() {
		// TODO: This reference to $_REQUEST is a bit of a hack
		return $this->getDeployForm($_REQUEST['EnvironmentName']);
	}
	
	public function doDeploy($data, $form) {
		$build = $this->DNData()->DNBuildList()->byName($data['BuildName']);
		$environment = $this->DNData()->DNEnvironmentList()->byName($data['EnvironmentName']);
		
		return $this->customise(new ArrayData(array(
			'EnvironmentName' => $environment->Name(),
			'BuildFullName' => $build->FullName(),
			'BuildFileName' => $build->Filename()
		)))->renderWith('DNRoot_deploy');
	}
	
	/**
	 * Do the actual deploy
	 *
	 * @param SS_HTTPRequest $request 
	 */
	public function deploy(SS_HTTPRequest $request) {
		$envName = $request->postVar('EnvironmentName');
		$buildFullName = $request->postVar('BuildFullName');
		$buildFileName = $request->postVar('BuildFileName');
		$this->DNData()->Backend()->deploy($envName, $buildFullName, $buildFileName);
	}
	
	/**
	 *
	 * @return string
	 */
	public function getlog() {
		$lines = file(ASSETS_PATH . '/'."deploy-log.txt");
		foreach($lines as $line) {
			echo $line;
		}
	}
	
}