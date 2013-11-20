<?php

class FetchJob {

	public $args;

	public function perform() {
		set_time_limit(0);
		
		$log = new DeploynautLogFile($this->args['logfile']);
		$projects = DNProject::get()->filter('Name', Convert::raw2sql($this->args['projectName']));
		
		$project = $projects->first();
		$path = $project->getLocalCVSPath();
		$env = $this->args['env'];
		
		$log->write('Starting git fetch for project "' . $project->Name . '"');

		$repository = new Gitonomy\Git\Repository($path, array(
			'environment_variables' => $env
		));
		$repository->run('fetch', array('-p', 'origin', '+refs/heads/*:refs/heads/*', '--tags'));
		$log->write('Git fetch is finished');
	}
}
