<?php
/**
 * DNProject represents a project that relates to a group of target
 * environments, and a has access to specific build tarballs.
 *
 * For the project to be able to pick up builds, the tarballs need to 
 * be stored in similarly named directories, e.g.:
 * deploynaut-resources/envs/ss3/dev.rb
 * deploynaut-resources/builds/ss3/ss3-1.0.3.tar.gz
 */

class DNProject extends ViewableData {

	/**
	 * Backlink to the contex DNData object.
	 */
	protected $data;

	/**
	 * Name of this project.
	 */
	protected $name;

	function __construct($name, DNData $data) {
		$this->name = $name;
		$this->data = $data;
		parent::__construct();
	}

	function getName() {
		return $this->name;
	}

	/**
	 * Provides a DNBuildList of builds found in this project.
	 */
	function DNBuildList() {
		return new DNBuildList($this->data->getBuildDir().'/'.$this->name, $this, $this->data);
	}

	/**
	 * Provides a DNEnvironmentList of environments found in this project.
	 */
	function DNEnvironmentList() {
		return new DNEnvironmentList($this->data->getEnvironmentDir().'/'.$this->name, $this, $this->data);
	}

	public function Link() {
		return "naut/project/$this->name";
	}
}
