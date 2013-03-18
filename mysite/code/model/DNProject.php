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

class DNProject extends DataObject {
	static $db = array(
		"Name" => "Varchar",
	);
	static $has_many = array(
		"Environments" => "DNEnvironment",
	);

	static function get($callerClass = null, $filter = "", $sort = "", $join = "", $limit = null,
			$containerClass = 'DataList') {
		return new DNProjectList('DNProject');
	}

	static function create_from_path($path) {
		$p = new DNProject;
		$p->Name = $path;
		$p->write();
		return $p;
	}

	function DNData() {
		return Injector::inst()->get('DNData');
	}

	/**
	 * Provides a DNBuildList of builds found in this project.
	 */
	function DNBuildList() {
		return new DNBuildList($this->DNData()->getBuildDir().'/'.$this->Name, $this, $this->DNData());
	}

	/**
	 * Provides a DNEnvironmentList of environments found in this project.
	 */
	public function DNEnvironmentList() {
		return DNEnvironment::get()->filter('ProjectID', $this->ID)->setProjectID($this->ID);
	}


	public function Link() {
		return "naut/project/$this->Name";
	}
}
