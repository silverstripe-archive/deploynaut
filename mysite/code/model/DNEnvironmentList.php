<?php

class DNEnvironmentList extends DataList {
	protected $projectID;

	function setProjectID($projectID) {
		$this->projectID = $projectID;
		return $this;
	}
	
	/**
	 * Sync the in-db project list with a list of file paths
	 * @param array $paths Array of pathnames
	 * @param boolean $remove Should obsolete environments be removed?
	 */
	public function syncWithPaths($paths, $remove = true) {
		foreach($paths as $path) {
			if(!$this->filter('Filename', $path)->count()) {
				Debug::message("Adding '$path' to project #$this->projectID");
				$e = DNEnvironment::create_from_path($path);
				$e->ProjectID = $this->projectID;
				$e->write();
			}
		}

		if($remove) {
			$removeList = $this->filter('Filename:not', $paths);
			if($count = $removeList->Count()) {
				Debug::message("Removing $count obsolete environments from #$this->projectID");
				$removeList->removeAll();
			}
		}
	}

}
