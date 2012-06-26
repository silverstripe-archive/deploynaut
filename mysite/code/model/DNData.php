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
	protected $environmentNames;
	
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
	 *
	 * @param string $buildPath
	 * @param array $environmentNames
	 * @param DeploymentBackend $backend 
	 */
	public function __construct($buildPath, $environmentNames, $backend) {
		$this->buildPath = $buildPath;
		$this->environmentNames = $environmentNames;
		
		$this->environmentList = new DNEnvironmentList($this->environmentNames, $this);
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