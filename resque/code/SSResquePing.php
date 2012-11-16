<?php

require_once BASE_PATH.'/resque/vendor/autoload.php';

class SSResquePing extends Controller {

	public function index() {
		$args = array(
			'message' => 'from '.$_SERVER['HTTP_HOST'],
			'time' => date('Y-m-d H:i:s')
		);
		$token = Resque::enqueue("dev:ping", "SSResquePingJob", $args);
		return 'Ping job created with token ' . $token . PHP_EOL;
	}	
}