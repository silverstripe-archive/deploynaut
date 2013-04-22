<?php
/**
 * Description of DeployJob
 *
 */

require_once(BASE_PATH.'/vendor/autoload.php');

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
		$logfile = DEPLOYNAUT_LOG_PATH . '/' . $this->args['logfile'];
		$projectName = $this->args['projectName'];

		$project = DNProject::get()->filter('Name', $projectName)->first();
		GraphiteDeploymentNotifier::notify_start($environment, $sha, null, $project);
		echo '[-] Deploying "'.$sha.'" to "'.$projectName.':'.$environment.'"'.PHP_EOL;

		$command = $this->getCommand($projectName.':'.$environment, $repository, $sha, $logfile);
		$command ->run(function ($type, $buffer) use($logfile) {
			$fh = fopen($logfile, 'a');
			if(!$fh) {
				throw new RuntimeException('Can\'t open file "'.$logfile.'" for logging.');
			}
			do {
				usleep(rand(1, 10000));
			} while (!flock($fh, LOCK_EX));
			fwrite($fh, $buffer);
			flock($fh, LOCK_UN);
			fclose($fh);
		});
		if(!$command->isSuccessful()) {
			throw new RuntimeException($command->getErrorOutput());
		}
		echo '[-] Deploy done "'.$sha.'" to "'.$projectName.':'.$environment.'"'.PHP_EOL;
		GraphiteDeploymentNotifier::notify_end($environment, $sha, null, $project);
	}

	/**
	 *
	 * @param string $environment
	 * @param string $repository
	 * @param string $sha
	 * @param string $logfile
	 * @return \Symfony\Component\Process\Process
	 */
	protected function getCommand($environment, $repository, $sha, $logfile) {
		$command = 'cap -vv '.$environment.' deploy';
		$command.= ' -s repository='.$repository;
		$command.= ' -s branch='.$sha;
		$command.= ' -s history_path='.realpath(DEPLOYNAUT_LOG_PATH.'/');
		$process = new \Symfony\Component\Process\Process($command);
		$process->setTimeout(3600);
		return $process;
	}

	public function tearDown() {
    }
}
