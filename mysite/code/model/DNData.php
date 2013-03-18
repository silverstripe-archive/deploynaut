<?php

/**
 * Parent class for managing a set of Deploynaut data
 */
class DNData {

	/**
	 * Path where the build tarballs can be found.
	 */
	protected static $build_dir = '';

	/**
	 * Path where the environment configurations can be found.
	 */
	protected static $environment_dir = '';
	
	/**
	 * A prebuilt DNProjectList.
	 */
	protected $projectList;
	
	/**
	 *
	 * @var DeploymentBackend
	 */
	protected $backend;
	
	/**
	 *
	 * @param string $buildPath
	 * @param array $environmentNames
	 * @param DeploymentBackend $backend 
	 */
	public function __construct($buildDir, $environmentDir) {
		$this->backend = Injector::inst()->get('DeploymentBackend');
		$this->setBuildDir($buildDir);
		$this->setEnvironmentDir($environmentDir);
	}

	public function getBuildDir() {
		return $this->buildDir;
	}
	public function setBuildDir($buildDir) {
		if($buildDir[0] != "/") $buildDir = BASE_PATH . '/' . $buildDir;
		$this->buildDir = $buildDir;
	}

	public function getEnvironmentDir() {
		return $this->environmentDir;
	}
	public function setEnvironmentDir($environmentDir) {
		if($environmentDir[0] != "/") $environmentDir = BASE_PATH . '/' . $environmentDir;
		$this->environmentDir = $environmentDir;
	}

	/**
	 *
	 * @return DNBuildList 
	 */
	public function DNProjectList() {
		return DNProject::get();
	}
	
	/**
	 *
	 * @return DeploymentBackend 
	 */
	public function Backend() {
		return $this->backend;
	}

	/**
	 * Grabs a list of projects from the env directory. The projects
	 * in the builds directory alone will not be picked up.
 	 * Returns an array of paths
 	 */
	public function getProjectPaths() {
		$paths = array();
		if(!file_exists($this->getEnvironmentDir())) {
			throw new Exception('The environment directory '.$this->getEnvironmentDir().' doesn\'t exist. Create it first and add some projects to it.');
		}
		foreach(scandir($this->getEnvironmentDir()) as $project) {
			// Exlcude dot-prefixed directories (.git was getting in the way)
			if(preg_match('/^[^\.]/', $project)) {
				$path = $this->getEnvironmentDir().'/'.$project;
				if(is_dir($path) && $project!='.' && $project!='..') {
					$paths[] = $project;
				}
			}
		}
		sort($paths);
		return array_values($paths);
	}

	/**
	 * Scan the directory and enumerate all envs founds within.
	 * Returns an array of paths
	 */
	public function getEnvironmentPaths($project) {
		$baseDir = $this->getEnvironmentDir() . '/' . $project;

		$paths = array();
		if(!file_exists($baseDir)) {
			throw new Exception('Environment directory '.$baseDir.' doesn\'t exist. Create it first.');
		}
		// Search the directory for config files.
		foreach(scandir($baseDir) as $environmentFile) {
			if(preg_match('/\.rb$/', $environmentFile)) {
				// Config found, wrap it into an object.
				$paths[] = "$baseDir/$environmentFile";
			}
		}
		sort($paths);
		return array_values($paths);
	}

}
