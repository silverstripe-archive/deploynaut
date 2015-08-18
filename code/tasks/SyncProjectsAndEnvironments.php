<?php

class SyncProjectsAndEnvironments extends BuildTask {
	/**
	 * @param SS_HTTPRequest $request
	 */
	public function run($request = null) {
		// should syncing remove obsolete records?
		$remove = true;
		$dryRun = true;

		if($request && $request->requestVar('remove') !== null) {
			$remove = (bool)$request->requestVar('remove');
		}

		if($request && $request->requestVar('dryrun') !== null) {
			$dryRun = (bool)$request->requestVar('dryrun');
		}

		if($dryRun) {
			echo "Running in dry run mode, no changes commited, ";
			echo "the output shows a prediction on what will happen." . PHP_EOL;
			echo "To skip dryrun, run the task like this:" . PHP_EOL;
			echo "./framework/sake dev/tasks/SyncProjectsAndEnvironments dryrun=0" . PHP_EOL . PHP_EOL;
			sleep(3);
		}

		$data = DNData::inst();
		$projectPaths = $data->getProjectPaths();

		// Sync projects
		$projects = DNProject::get();
		if($remove) {
			$this->echoHeader('Removing obsolete projects');
			$this->removeObsoleteProjects($projectPaths, $dryRun);
		}
		$this->echoHeader('Adding new projects');
		$this->syncProjectPaths($projectPaths, $dryRun);

		$this->echoHeader('Syncing environment files');
		foreach($projects as $project) {
			$this->echoHeader($project->Name);
			// Sync environments for each project
			$environmentPaths = $data->getEnvironmentPaths($project->Name);
			$this->removeObsoleteEnvironments($environmentPaths, $project, $dryRun);
			$this->syncEnvironmentPaths($environmentPaths, $project, $dryRun);
		}
	}

	/**
	 * Remove environment files that can't be found on disk
	 *
	 * @param array $paths Array of pathnames
	 * @param DNProject
	 * @param bool $dryRun
	 */
	protected function removeObsoleteEnvironments($paths, $project, $dryRun = false) {
		$list = $project->Environments();

		$basePaths = array_map(function($path) {
			return basename($path);
		}, $paths);

		$removeList = $list->filter('Filename:not', $basePaths);
		if($removeList->count() === 0) {
			return;
		}

		foreach($removeList as $remove) {
			$this->message('Removing "' . basename($remove->Name) . '" from db');
			if(!$dryRun) {
				$removeList->remove($remove);
			}
		}
	}

	/**
	 * Remove projects that don't exists on disk but in the database
	 *
	 * @todo add a archive functionality
	 *
	 * @param array $paths
	 */
	protected function removeObsoleteProjects($paths, $dryrun = false) {
		$removeList = DNProject::get()->filter('Name:not', $paths);
		if($removeList->count() == 0) {
			return;
		}

		foreach($removeList as $remove) {
			$this->message($remove->Name . ' ' . $remove->Path);
			if(!$dryrun) {
				$removeList->remove($remove);
			}
		}
	}

	/**
	 * Sync the in-db project list with a list of file paths
	 *
	 * @param array $paths Array of pathnames
	 * @param DNProject
	 * @param bool $dryRun
	 */
	protected function syncEnvironmentPaths($paths, $project, $dryRun = false) {
		$list = $project->Environments();

		// Normalise paths in DB
		foreach($list as $item) {
			$real = realpath($item->Filename);
			if($real && $real != $item->Filename) {
				$item->Filename = $real;
				$item->write();
			}
		}

		foreach($paths as $path) {
			$path = basename($path);
			if($list->filter('Filename', $path)->count()) {
				continue;
			}

			$this->message('Adding "' . basename($path) . '" to db');
			if(!$dryRun) {
				$environment = DNEnvironment::create_from_path($path);
				$environment->ProjectID = $project->ID;
				$environment->write();
			}
		}
	}

	/**
	 * Sync the in-db project list with a list of file paths
	 *
	 * @param array $paths Array of pathnames
	 * @param boolean $dryRun
	 */
	public function syncProjectPaths($paths, $dryRun = false) {
		foreach($paths as $path) {
			if(!DNProject::get()->filter('Name', $path)->count()) {
				$this->message($path);
				if(!$dryRun) {
					DNProject::create_from_path($path)->write();
				}
			}
		}
	}

	/**
	 * @param string $text
	 */
	protected function message($text) {
		if(PHP_SAPI !== 'cli') {
			$text = '<p>' . $text . '</p>' . PHP_EOL;
		}
		echo ' - ' . $text . PHP_EOL;
	}

	/**
	 * @param string $text
	 */
	protected function echoHeader($text) {
		if(PHP_SAPI !== 'cli') {
			echo '<h2>' . $text . '</h2>' . PHP_EOL;
		} else {
			echo '# ' . $text . PHP_EOL;
		}
	}
}
