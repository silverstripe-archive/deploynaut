<?php

class UpdateGitRepo {

	public $args;

	public function perform() {
		set_time_limit(0);
		$path = $this->args['path'];
		$repo = $this->args['repo'];
		
		if(file_exists($path)) {
			$this->delTree($path);
		}
		mkdir($path, 0777, true);
		echo '[+] Cloning ' . $repo.' to ' . $path . PHP_EOL;

		// using git clone straight of since doing it via Gitonomy\Git\Admin
		// times out. Silly.
		$command = sprintf('git clone --bare -q %s %s', $repo, $path);
		exec($command, $output, $return_var);

		if($return_var != 0) {
			$file = DEPLOYNAUT_LOG_PATH . '/updategitrepo.log';
			$fh = fopen($file, 'a');
			fwrite($fh, sprintf('\'%s\' exited with return code %s. Output: "%s"' . PHP_EOL, $command, $return_var, var_export($output, true)));
			fclose($fh);
		}

		echo '[+] Cloned ' . $repo . ' to ' . $path . PHP_EOL;
	}

	protected function delTree($dir) {
		$files = array_diff(scandir($dir), array('.','..'));
		foreach ($files as $file) {
			(is_dir("$dir/$file")) ? $this->delTree("$dir/$file") : unlink("$dir/$file");
		}
		return rmdir($dir);
  }
}
