<?php

class FetchGitRepo {

	public $args;

	public function perform() {
		set_time_limit(0);
		$path = $this->args['path'];
	
		echo '[+] Fetching from' . $path . PHP_EOL;

		$repository = new Gitonomy\Git\Repository($path);
		$repository->run('fetch', array('origin', '+refs/heads/*:refs/heads/*', '--tags'));
		
		echo '[+] Fetch from ' . $path . ' is done' . PHP_EOL;
	}
}
