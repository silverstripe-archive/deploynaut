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
	public function __construct($buildDir, $environmentDir, $backend) {
		$this->buildDir = $buildDir;
		$this->environmentDir = $environmentDir;
		
		$this->projectList = new DNProjectList($this);
		
		$this->backend = $backend;
	}

	/**
	 *
	 * @return string
	 */
	public function getBuildDir() {
		return $this->buildDir;
	}

	/**
	 *
	 * @return string
	 */
	public function getEnvironmentDir() {
		return $this->environmentDir;
	}
	
	/**
	 *
	 * @return DNBuildList 
	 */
	public function DNProjectList() {
		return $this->projectList;
	}
	
	/**
	 *
	 * @return DeploymentBackend 
	 */
	public function Backend() {
		return $this->backend;
	}
}
