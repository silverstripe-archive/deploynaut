<?php

class DNBuildList extends ArrayList {
	/**
	 * This project's build files directory. 
	 * All tarballs sit directly under that path.
	 */
	protected $baseDir;

	/**
	 * Backlink to the contex DNData object.
	 */
	protected $data;

	/**
	 * An associative array of build name => DNBuild object.
	 */
	protected $builds;

	/**
	 * Project this DNBuildList belongs to. Effectively, a has_one-like relatonship.
	 */
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

	/**
	 * Scan the directory and enumerate all builds founds within.
	 * Returns an array of DNBuilds.
	 */
	protected function getBuilds() {
		$builds = array();
		
		if(!file_exists($this->baseDir)) {
			throw new Exception('Build directory '.$this->baseDir.' doesn\'t exist. Create it first.');
		}
		// Search the directory for tarballs.
		foreach(scandir($this->baseDir) as $buildFile) {
			if(preg_match('/tar\\.gz$/', $buildFile)) {
				// Found, wrap in an object.
				$path = "$this->baseDir/$buildFile";
				$builds[filemtime($path)] = new DNBuild($path, $this->project, $this->data);
			}
		}
		krsort($builds);
		return array_values($builds);
	}

	/**
	 * Find a build in this set by name.
	 */
	function byName($name) {
		return $this->builds[$name];
	}
	
}
