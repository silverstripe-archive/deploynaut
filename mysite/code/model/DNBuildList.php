<?php

class DNBuildList extends ArrayList {
	protected $baseDir, $data;
	protected $builds;
	
	function __construct($baseDir, DNData $data) {
		$this->baseDir = $baseDir;
		$this->data = $data;
		
		$builds = $this->getBuilds();
		$this->builds = array();
		foreach($builds as $build) $this->builds[$build->FullName()] = $build;
		
		parent::__construct($builds);
	}
	
	protected function getBuilds() {
		$builds = array();
		foreach(scandir($this->baseDir) as $buildFile) {
			if(preg_match('/tar\\.gz$/', $buildFile)) {
				$path = "$this->baseDir/$buildFile";
				$builds[filemtime($path)] = new DNBuild($path, $this->data);
			}
		}
		krsort($builds);
		return array_values($builds);
	}

	function byName($name) {
		return $this->builds[$name];
	}
	
}