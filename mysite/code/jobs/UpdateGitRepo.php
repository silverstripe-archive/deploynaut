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
		echo '[+] Cloning '.$repo.' to '.$path.''.PHP_EOL;
		// using git clone straight of since doing it via Gitonomy\Git\Admin
		// times out. Silly.
		system('`which git` clone --bare -q '.$repo.' '.$path);
		echo '[+] Cloned '.$repo.' to '.$path.''.PHP_EOL;
	}

	protected function delTree($dir) {
		$files = array_diff(scandir($dir), array('.','..'));
		foreach ($files as $file) {
			(is_dir("$dir/$file")) ? $this->delTree("$dir/$file") : unlink("$dir/$file");
		}
		return rmdir($dir);
  }
}