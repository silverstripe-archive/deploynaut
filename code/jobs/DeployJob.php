<?php

/**
 * Runs a deployment via the most appropriate backend
 */
class DeployJob {

	public $args;

	public function setUp() {
		global $databaseConfig;
		DB::connect($databaseConfig);
		chdir(BASE_PATH);
	}

	public function DNData() {
		return Injector::inst()->get('DNData');
	}

	public function perform() {
		echo "[-] DeployJob starting" . PHP_EOL;

		$log = new DeploynautLogFile($this->args['logfile']);

		$env = $this->args['env'];

		$DNProject = $this->DNData()->DNProjectList()->filter('Name', $this->args['projectName'])->First();

		$this->DNData()->Backend()->deploy(
			$this->args['environment'],
			$this->args['sha'],
			$log,
			$DNProject
		);
	}

}
