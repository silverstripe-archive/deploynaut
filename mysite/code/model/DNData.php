<?php

/**
 * Parent class for managing a set of Deploynaut data
 */
class DNData {
	protected $buildPath;
	protected $environmentNames;
	
	protected $environmentList;
	protected $buildList;
	protected $backend;
	
	function __construct($buildPath, $environmentNames, $backend) {
		$this->buildPath = $buildPath;
		$this->environmentNames = $environmentNames;
		
		$this->environmentList = new DNEnvironmentList($this->environmentNames, $this);
		$this->buildList = new DNBuildList($this->buildPath, $this);
		
		$this->backend = $backend;
	}
	
	function DNEnvironmentList() {
		return $this->environmentList;
	}
	function DNBuildList() {
		return $this->buildList;
	}
	function Backend() {
		return $this->backend;
	}
}