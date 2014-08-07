<?php

class FetchJob {

	public $args;

	/**
	 * 
	 * @global array $databaseConfig
	 */
	public function setUp() {
		global $databaseConfig;
		DB::connect($databaseConfig);
		chdir(BASE_PATH);
	}
	
	public function perform() {
		set_time_limit(0);
		
		$log = new DeploynautLogFile($this->args['logfile']);
		$projects = DNProject::get()->filter('Name', Convert::raw2sql($this->args['projectName']));
		
		$project = $projects->first();
		$path = $project->getLocalCVSPath();
		$env = $this->args['env'];
		
		$log->write('Starting git fetch for project "' . $project->Name . '"');

		$options = array('environment_variables' => $env);
		// if an alternate user has been configured for clone, run the command as that user
		$user = Injector::inst()->get('DNData')->getGitUser();
		if($user) {
			$options['command'] = sprintf('sudo -u %s git', $user);
		}

		$repository = new Gitonomy\Git\Repository($path, $options);
		$repository->run('fetch', array('-p', 'origin', '+refs/heads/*:refs/heads/*', '--tags'));
		$log->write('Git fetch is finished');
	}
}
