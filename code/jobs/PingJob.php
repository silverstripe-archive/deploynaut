<?php

/**
 * Runs a capistrano job that will check the connection and that all folders with
 * permission are setup correctly
 */
class PingJob {

	/**
	 * @var array
	 */
	public $args;

	/**
	 * @global array $databaseConfig
	 */
	public function setUp() {
		global $databaseConfig;
		DB::connect($databaseConfig);
		chdir(BASE_PATH);
	}

	/**
	 * @return DNData
	 */
	public function DNData() {
		return DNData::inst();
	}

	/**
	 * Do the actual job by calling the appropiate backend
	 */
	public function perform() {
		echo "[-] PingJob starting" . PHP_EOL;
		$log = new DeploynautLogFile($this->args['logfile']);

		$ping = DNPing::get()->byID($this->args['pingID']);
		$environment = $ping->Environment();
		$project = $environment->Project();
		$environment->Backend()->ping($environment, $log, $project);
	}
}
