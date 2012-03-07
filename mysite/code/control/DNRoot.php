<?php

class DNRoot extends Controller {
	protected $data;
	
	function Link() {
		return "naut/";
	}
	function index() {
		return $this->redirect($this->Link() . 'builds');
	}

	function DNData() {
		if(!$this->data) $this->data = new DNData(BASE_PATH . "/builds", array(
			"dojo", "staging", "live"
		), new DemoDeploymentBackend());
		return $this->data;
	}
	
	function DNBuilds() {
		return $this->DNData()->DNBuildList();
	}
	
	function DNEnvironments() {
		return $this->DNData()->DNEnvironmentList();
	}
	
	function environment() {
		$env = $this->DNData()->DNEnvironmentList()->byName($this->urlParams['ID']);
		return array(
			"DNEnvironment" => $env,
			"DeployForm" => $this->getDeployForm($env->Name()),
		);
	}

	function build() {
		return array(
			"DNBuild" => $this->DNData()->DNBuildList()->byName($this->urlParams['ID']),
		);
	}
	
	function getDeployForm($environmentName) {
		$buildList = array('' => '(Choose a build)');
		foreach($this->DNData()->DNBuildList() as $build) {
			$buildList[$build->FullName()] = $build->Name();
		}
		
		return new Form($this, 'DeployForm', new FieldList(
			new HiddenField('EnvironmentName', '', $environmentName),
			new DropdownField("BuildName", "Build", $buildList)
		), new FieldList(
			new FormAction('doDeploy', "Deploy to " . $environmentName)
		));
	}
	function DeployForm() {
		// TODO: This reference to $_REQUEST is a bit of a hack
		return $this->getDeployForm($_REQUEST['EnvironmentName']);
	}
	function doDeploy($data, $form) {
		$build = $this->DNData()->DNBuildList()->byName($data['BuildName']);
		$environment = $this->DNData()->DNEnvironmentList()->byName($data['EnvironmentName']);
		
		echo "<h2>Deploying " . $build->Name() . " to " . $environment->Name() . "</h2>";
		echo "<pre>\n";
		flush();
		
		$this->DNData()->Backend()->deploy($environment->Name(), $build->FullName(), $build->Filename());
		
		echo "</pre>\n";
		echo "<p><a href=".  Director::baseURL() . "/naut/environment/" . $environment->Name() . ">done</a></p>";
	}
	
}