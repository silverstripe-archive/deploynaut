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
	public function syncWithPaths($paths, $remove = true, $dryRun = false) {
		// Normalise paths in DB
		foreach($this as $item) {
			$real = realpath($item->Filename);
			if($real && $real != $item->Filename) {
				$item->Filename = $real;
				$item->write();
			}
		}

		// Normalise provided paths
		foreach($paths as $i => $path) {
			$paths[$i] = realpath($path);
		}

		foreach($paths as $path) {
			if(!$this->filter('Filename', $path)->count()) {
				echo "<p>Adding '$path' to project #$this->projectID</p>\n";
				if(!$dryRun) {
					$e = DNEnvironment::create_from_path($path);
					$e->ProjectID = $this->projectID;
					$e->write();
				}
			}
		}

		if($remove) {
			$removeList = $this->filter('Filename:not', $paths);
			if($count = $removeList->Count()) {
				echo "<p>Removing $count obsolete environments from #$this->projectID</p>\n";
				if(!$dryRun) {
					$removeList->removeAll();
				}
			}
		}
	}

}
