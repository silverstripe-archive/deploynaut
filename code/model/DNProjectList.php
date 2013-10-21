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
	 * @param boolean $dryRun
	 */
	public function syncWithPaths($paths, $dryRun = false) {
		foreach($paths as $path) {
			if(!$this->filter('Name', $path)->count()) {
				$this->message($path);
				if(!$dryRun) {
					DNProject::create_from_path($path)->write();
				}
			}
		}
	}
	
	/**
	 * Remove projects that don't exists on disk but in the database
	 * @todo add a archive functionality
	 * 
	 * @param array $paths
	 */
	public function removeObsolete($paths, $dryrun = false) {
		$removeList = $this->filter('Name:not', $paths);
		if($removeList->Count() == 0) {
			return;
		}
		
		foreach($removeList as $remove) {
			$this->message($remove->Name.' '.$remove->Path);
			if(!$dryrun) {
				$removeList->remove($remove);
			}
		}
	}
	
	/**
	 * 
	 * @param string $text
	 */
	protected function message($text) {
		if(PHP_SAPI !== 'cli') {
			$text = '<p>'.$text.'</p>'.PHP_EOL;
		}
		echo ' - '.$text.PHP_EOL;
	}
}
