<?php

/**
 * Parent class for managing a set of Deploynaut data
 */
class DNData {
	
	/**
	 *
	 * @var string
	 */
	protected $buildPath;
	
	/**
	 *
	 * @var array
	 */
	protected static $environment_names = array();
	
	/**
	 *
	 * @var DNEnvironmentList 
	 */
	protected $environmentList;
	
	/**
	 *
	 * @var DNBuildList 
	 */
	protected $buildList;
	
	/**
	 *
	 * @var DeploymentBackend
	 */
	protected $backend;
	
	/**
	 * Set the environment names that will be used
	 * @var array $environmentNames
	 */
	public static function set_environment_names($environmentNames) {
		self::$environment_names = $environmentNames;
	}
	
	/**
	 *
	 * @param string $buildPath
	 * @param array $environmentNames
	 * @param DeploymentBackend $backend 
	 */
	public function __construct($buildPath, $backend) {
		$this->buildPath = $buildPath;
		
		$this->environmentList = new DNEnvironmentList(self::$environment_names, $this);
		$this->buildList = new DNBuildList($this->buildPath, $this);
		
		$this->backend = $backend;
	}
	
	/**
	 *
	 * @return DNEnvironmentList
	 */
	public function DNEnvironmentList() {
		return $this->environmentList;
	}
	
	/**
	 *
	 * @return DNBuildList 
	 */
	public function DNBuildList() {
		return $this->buildList;
	}
	
	/**
	 *
	 * @return DeploymentBackend 
	 */
	public function Backend() {
		return $this->backend;
	}
}