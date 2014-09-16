<?php

/**
 * Runs a deployment via the most appropriate backend
 */
class DeployJob {

	/**
	 *
	 * @var array
	 */
	public $args;

	/**
	 *
	 */
	public function setUp() {
		$this->updateStatus('Started');
		chdir(BASE_PATH);
	}

	/**
	 *
	 * @global array $databaseConfig
	 */
	public function tearDown() {
		$this->updateStatus('Finished');
		chdir(BASE_PATH);
	}

	/**
	 *
	 */
	public function perform() {
		echo "[-] DeployJob starting" . PHP_EOL;
		$log = new DeploynautLogFile($this->args['logfile']);
		$DNProject = $this->DNData()->DNProjectList()->filter('Name', $this->args['projectName'])->First();
		$DNEnvironment = $DNProject->Environments()->filter('Name', $this->args['environmentName'])->First();
		// This is a bit icky, but there is no easy way of capturing a failed deploy by using the PHP Resque
		try {
			$this->DNData()->Backend()->deploy(
				$DNEnvironment,
				$this->args['sha'],
				$log,
				$DNProject,
				isset($this->args['leaveMaintenacePage']) ? $this->args['leaveMaintenacePage'] : false
			);
		} catch(RuntimeException $exc) {
			$this->updateStatus('Failed');
			echo "[-] DeployJob failed" . PHP_EOL;
			throw $exc;
		}
		echo "[-] DeployJob finished" . PHP_EOL;
	}

	/**
	 *
	 * @param string $status
	 * @global array $databaseConfig
	 */
	protected function updateStatus($status) {
		global $databaseConfig;
		DB::connect($databaseConfig);
		$dnDeployment = DNDeployment::get()->byID($this->args['deploymentID']);
		$dnDeployment->Status = $status;
		$dnDeployment->write();
	}

	/**
	 *
	 * @return DNData
	 */
	protected function DNData() {
		return Injector::inst()->get('DNData');
	}
}
