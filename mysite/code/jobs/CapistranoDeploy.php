<?php

/**
 * Description of DeployJob
 *
 */
class CapistranoDeploy {
	
	public $args;

	public function setUp() {
        global $databaseConfig;
		DB::connect($databaseConfig);
		chdir(BASE_PATH);
    }
	
	public function perform() {
		$environment = $this->args['environment'];
		$repository = $this->args['repository'];
		$sha = $this->args['sha'];
		$logfile = $this->args['logfile'];
		$projectName = $this->args['projectName'];

		$project = DNProject::get()->filter('Name', $projectName)->first();
		GraphiteDeploymentNotifier::notify_start($environment, $sha, null, $project);
		
		$command = $this->getCommand($projectName.':'.$environment, $repository, $sha, $logfile);
		echo '[=] Deploying "'.$sha.'" to "'.$projectName.':'.$environment.'"'.PHP_EOL;
		system($command, $status);
		if($status !== 0) {
			throw new Exception('Deployment failed');
		} 
		echo '[+] Success '.$logfile.PHP_EOL;
		GraphiteDeploymentNotifier::notify_end($environment, $sha, null, $project);
	}

	/**
	 *
	 * @param string $environment
	 * @param string $repository
	 * @param string $sha
	 * @param string $logfile
	 * @return type
	 */
	protected function getCommand($environment, $repository, $sha, $logfile) {
		$logfile = ASSETS_PATH.'/'.$logfile;
		
		$command = 'cap -vv '.$environment.' deploy';
		$command.= ' -s repository='.$repository;
		$command.= ' -s branch='.$sha;
		$command.= " > '{$logfile}' 2> '{$logfile}'";
		return $command;
	}

	public function tearDown() {
    }
}
