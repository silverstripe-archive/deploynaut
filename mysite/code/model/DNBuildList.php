<?php

class DNBuildList extends ArrayList {
	protected $baseDir;
	protected $data;
	protected $builds;
	protected $project;
	
	function __construct($baseDir, $project, DNData $data) {
		$this->baseDir = $baseDir;
		$this->data = $data;
		$this->project = $project;
		
		$builds = $this->getBuilds();

		$this->builds = array();
		foreach($builds as $build) {
			$this->builds[$build->FullName()] = $build;
		}
		
		parent::__construct($builds);
	}
	
	protected function getBuilds() {
		$builds = array();
		foreach(scandir($this->baseDir) as $buildFile) {
			if(preg_match('/tar\\.gz$/', $buildFile)) {
				$path = "$this->baseDir/$buildFile";
				$builds[filemtime($path)] = new DNBuild($path, $this->project, $this->data);
			}
		}
		krsort($builds);
		return array_values($builds);
	}

	function byName($name) {
		return $this->builds[$name];
	}
	
}
