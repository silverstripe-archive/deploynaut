<?php

class SyncProjectsAndEnvironments extends BuildTask {
	
	public function run($request = null) {
		// should syncing remove obsolete records?
		$remove = true;
		$dryRun = true;
		
		if($request && $request->requestVar('remove') !== NULL) {
			$remove = (bool) $request->requestVar('remove');
		}
		
		if($request && $request->requestVar('dryrun') !== NULL) {
			$dryRun = (bool) $request->requestVar('dryrun');
		}
		
		if($dryRun) {
			echo "Running in dry run mode, no changes commited, ";
			echo "the output shows a prediction on what will happen.".PHP_EOL;
			echo "To skip dryrun, run the task like this:".PHP_EOL;
			echo "./framework/sake dev/tasks/SyncProjectsAndEnvironments dryrun=0".PHP_EOL.PHP_EOL;
			sleep(3);
		}
		
		$data = Injector::inst()->get('DNData');
		$projectPaths = $data->getProjectPaths();

		// Sync projects
		$projects = DNProject::get();
		if($remove) {
			$this->echoHeader('Removing obsolete projects');
			$projects->removeObsolete($projectPaths, $dryRun);
		}
		$this->echoHeader('Adding new projects');
		$projects->syncWithPaths($projectPaths, $dryRun);
		
		$this->echoHeader('Syncing environment files');
		foreach($projects as $project) {
			$this->echoHeader($project->Name);
			// Sync environments for each project
			$environmentPaths = $data->getEnvironmentPaths($project->Name);
			$project->DNEnvironmentList()->removeObsolete($environmentPaths, $dryRun);
			$project->DNEnvironmentList()->syncWithPaths($environmentPaths, $dryRun);
		}
	}
	
	/**
	 * 
	 * @param string $text
	 */
	protected function echoHeader($text) {
		if(PHP_SAPI !== 'cli') {
			echo '<h2>'.$text.'</h2>'.PHP_EOL;
		} else {
			echo '# '.$text.PHP_EOL;
		}
	}
}
