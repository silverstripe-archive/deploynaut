<?php

class DNEnvironmentList extends ArrayList {
	/**
	 * This project's env files directory. 
	 * All configs sit directly under that path.
	 */
	protected $baseDir;

	/**
	 * This project's build files directory. 
	 * All tarballs sit directly under that path.
	 */
	protected $data;

	/**
	 * An associative array of build name => DNEvnironment objects.
	 */
	protected $environments;

	/**
	 * Project this DNEnvironmentList belongs to. Effectively, a has_one-like relatonship.
	 */	
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

		
	/**
	 * Scan the directory and enumerate all envs founds within.
	 * Returns an array of DNEnvironments.
	 */
	protected function getEnvironments() {
		$environments = array();
		// Search the directory for config files.
		foreach(scandir($this->baseDir) as $environmentFile) {
			if(preg_match('/\.rb$/', $environmentFile)) {
				// Config found, wrap it into an object.
				$path = "$this->baseDir/$environmentFile";
				$environments[] = new DNEnvironment($path, $this->project, $this->data);
			}
		}
		sort($environments);
		return array_values($environments);
	}

	/**
	 * Find an environment within this set by name.
	 */
	function byName($name) {
		return $this->environments[$name];
	}
}
