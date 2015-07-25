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

		// if an alternate user has been configured for clone, run the command as that user
		// @todo Gitonomy doesn't seem to have any way to prefix the command properly, if you
		// set 'sudo -u composer git' as the "command" parameter, it tries to run the whole
		// thing as a single command and fails
		$user = DNData::inst()->getGitUser();
		if($user) {
			$command = sprintf('cd %s && sudo -u %s git fetch -p origin +refs/heads/*:refs/heads/* --tags', $path, $user);
			$process = new \Symfony\Component\Process\Process($command);
			$process->setEnv($env);
			$process->setTimeout(3600);
			$process->run();
			if(!$process->isSuccessful()) {
				throw new RuntimeException($process->getErrorOutput());
			}
		} else {
			$repository = new Gitonomy\Git\Repository($path, array('environment_variables' => $env));
			$repository->run('fetch', array('-p', 'origin', '+refs/heads/*:refs/heads/*', '--tags'));
		}

		$log->write('Git fetch is finished');
	}
}
