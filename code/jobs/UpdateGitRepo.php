<?php

class UpdateGitRepo {

	public $args;

	public function perform() {
		$path = $this->args['path'];
		$repo = $this->args['repo'];
		if(!file_exists($path)) {
			mkdir($path, 0777, true);
			echo '[+] Cloning '.$repo.' to '.$path.''.PHP_EOL;
			Gitonomy\Git\Admin::cloneTo($path, $repo);
			echo '[+] Cloned '.$repo.' to '.$path.''.PHP_EOL;
		} else {
			echo '[+] Fetching updates for '.$path.PHP_EOL;
			$repository = new Gitonomy\Git\Repository($path);
			$repository->run('fetch', array('--all'));
			echo '[+] Fetched updates for '.$path.PHP_EOL;
		}
		return true;
	}
}