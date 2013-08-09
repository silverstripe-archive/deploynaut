<?php
/*
 * DNProjectList picks up namespaces in the envs directory.
 * Namespace is capistrano-multiconfig way of saying "directory".
 * They can be nested, but we only use single level here to
 * specify projects.
 */

class DNProjectList extends DataList {

	/**
	 * Sync the in-db project list with a list of file paths
	 * @param array $paths Array of pathnames
	 */
	public function syncWithPaths($paths) {
		foreach($paths as $path) {
			if(!$this->filter('Name', $path)->count()) {
				Debug::message("Adding project '$path'");
				DNProject::create_from_path($path)->write();
			}
		}

		$remove = $this->filter('Name:not', $paths);
		if($count = $remove->Count()) {
			Debug::message("Removing $count obsolete projects");
			$remove->removeAll();
		}
	}

}
