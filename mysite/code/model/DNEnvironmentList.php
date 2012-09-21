<?php

class DNEnvironmentList extends ArrayList {
	protected $baseDir;
	protected $data;
	protected $environments;
	protected $project;
	
	function __construct($baseDir, $project, DNData $data) {
		$this->baseDir = $baseDir;
		$this->data = $data;
		$this->project = $project;
		
		$environments = $this->getEnvironments();

		$this->environments = array();
		foreach($environments as $environment) {
			$this->environments[$environment->Name()] = $environment;
		}

		parent::__construct($environments);
	}
	
	protected function getEnvironments() {
		$environments = array();
		foreach(scandir($this->baseDir) as $environmentFile) {
			if(preg_match('/\.rb$/', $environmentFile)) {
				$path = "$this->baseDir/$environmentFile";
				$environments[filemtime($path)] = new DNEnvironment($path, $this->project, $this->data);
			}
		}
		krsort($environments);
		return array_values($environments);
	}

	function byName($name) {
		return $this->environments[$name];
	}
}
