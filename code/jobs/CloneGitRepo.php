<?php

class CloneGitRepo {

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
		$path = $this->args['path'];
		$repo = $this->args['repo'];
		$env = $this->args['env'];
		$logfile = DEPLOYNAUT_LOG_PATH . '/clonegitrepo.log';
		$fh = fopen($logfile, 'a');
		if(!$fh) {
			throw new RuntimeException(sprintf('Can\'t open file "%s" for logging.', $logfile));
		}

		// if an alternate user has been configured for clone, run the command as that user
		$user = DNData::inst()->getGitUser();

		if(file_exists($path)) {
			$command = array();
			if($user) $command[] = sprintf('sudo -u %s', $user);
			$command[] = sprintf('rm -rf %s', $path);

			fwrite($fh, sprintf('[%s] Cleaning up existing repository %s', date('Y-m-d H:i:s'), $path) . PHP_EOL);
			fwrite($fh, sprintf('[%s] Running command: %s', date('Y-m-d H:i:s'), implode(' ', $command)) . PHP_EOL);

			$process = new \Symfony\Component\Process\Process(implode(' ', $command));
			$process->setEnv($env);
			$process->setTimeout(3600);
			$process->run();
			if(!$process->isSuccessful()) {
				fwrite($fh, sprintf('[%s] Error cleaning up existing repository: %s', date('Y-m-d H:i:s'), $process->getErrorOutput()) . PHP_EOL);
				throw new RuntimeException($process->getErrorOutput());
			}
		}

		fwrite($fh, sprintf('[%s] Cloning repository %s to %s', date('Y-m-d H:i:s'), $repo, $path) . PHP_EOL);
		echo "[-] CloneGitRepo starting" . PHP_EOL;

		$command = array();
		if($user) $command[] = sprintf('sudo -u %s', $user);
		$command[] = sprintf('/usr/bin/git clone --bare -q %s %s', $repo, $path);

		fwrite($fh, sprintf('[%s] Running command: %s', date('Y-m-d H:i:s'), implode(' ', $command)) . PHP_EOL);

		$process = new \Symfony\Component\Process\Process(implode(' ', $command));
		$process->setEnv($env);
		$process->setTimeout(3600);
		$process->run();
		if(!$process->isSuccessful()) {
			fwrite($fh, sprintf('[%s] Error cloning repository %s to %s: %s', date('Y-m-d H:i:s'), $repo, $path, $process->getErrorOutput()) . PHP_EOL);
			throw new RuntimeException($process->getErrorOutput());
		}

		fwrite($fh, sprintf('[%s] Successfully cloned repository %s to %s', date('Y-m-d H:i:s'), $repo, $path) . PHP_EOL);
	}

}
