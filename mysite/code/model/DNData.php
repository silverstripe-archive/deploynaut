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
	 * @param string $buildDir 
	 */
	public static function set_builds_dir($buildDir) {
		self::$build_dir = $buildDir;
	}
	
	/**
	 *
	 * @param string $environmentDir 
	 */
	public static function set_environment_dir($environmentDir) {
		self::$environment_dir = $environmentDir;
	}
	
	/**
	 *
	 * @param string $buildPath
	 * @param array $environmentNames
	 * @param DeploymentBackend $backend 
	 */
	public function __construct($backend) {
		$this->projectList = new DNProjectList($this);
		$this->backend = $backend;
	}

	/**
	 *
	 * @return string
	 */
	public function getBuildDir() {
		return self::$build_dir;
	}

	/**
	 *
	 * @return string
	 */
	public function getEnvironmentDir() {
		return self::$environment_dir;
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
