<?php

class CloneGitRepo {

	public $args;

	public function perform() {
		set_time_limit(0);
		$path = $this->args['path'];
		$repo = $this->args['repo'];
		$env = $this->args['env'];
		$logfile = DEPLOYNAUT_LOG_PATH . '/clonegitrepo.log';
		$fh = fopen($logfile, 'a');
		if(!$fh) {
			throw new RuntimeException('Can\'t open file "'.$logfile.'" for logging.');
		}

		if(file_exists($path)) {
			$this->delTree($path);
		}
		mkdir($path, 0777, true);

		fwrite($fh, 'Cloning ' . $repo.' to ' . $path . PHP_EOL);

		// using git clone straight via system call since doing it via the
		// Gitonomy\Git\Admin times out. Silly.
		$command = sprintf('git clone --bare -q %s %s', $repo, $path);

		fwrite($fh, 'Running command: ' . $command . PHP_EOL);

		$process = new \Symfony\Component\Process\Process($command);
		$process->setEnv($env);
		$process->setTimeout(3600);
		$process->run();
		if(!$process->isSuccessful()) {
			throw new RuntimeException($process->getErrorOutput());
		}

		echo fwrite($fh, 'Cloned ' . $repo . ' to ' . $path . PHP_EOL);
	}

	protected function delTree($dir) {
		$files = array_diff(scandir($dir), array('.','..'));
		foreach ($files as $file) {
			(is_dir("$dir/$file")) ? $this->delTree("$dir/$file") : unlink("$dir/$file");
		}
		return rmdir($dir);
	}
}
