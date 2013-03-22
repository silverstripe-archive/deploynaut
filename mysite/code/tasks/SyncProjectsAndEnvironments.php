<?php

class SyncProjectsAndEnvironments extends BuildTask {
	function run($request = null) {
		$data = Injector::inst()->get('DNData');

		$projectPaths = $data->getProjectPaths();

		// Sync projects
		$projects = DNProject::get();
		$projects->syncWithPaths($projectPaths);

		foreach($projects as $project) {
			// Sync environments for each project
			$environmentPaths = $data->getEnvironmentPaths($project->Name);

			$project->DNEnvironmentList()->syncWithPaths($environmentPaths);
		}
	}
}