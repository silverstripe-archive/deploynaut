<?php

class SyncProjectsAndEnvironments extends BuildTask {
	function run($request = null) {
		// should syncing remove obsolete records?
		$remove = ($request && $request->requestVar('remove') !== NULL) ? (bool) $request->requestVar('remove') : true;
		$data = Injector::inst()->get('DNData');
		$projectPaths = $data->getProjectPaths();

		// Sync projects
		$projects = DNProject::get();
		$projects->syncWithPaths($projectPaths, $remove);

		foreach($projects as $project) {
			// Sync environments for each project
			$environmentPaths = $data->getEnvironmentPaths($project->Name);

			$project->DNEnvironmentList()->syncWithPaths($environmentPaths, $remove);
		}
	}
}
