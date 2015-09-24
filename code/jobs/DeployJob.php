<?php

/**
 * Runs a deployment via the most appropriate backend
 */
class DeployJob {

	/**
	 * @var array
	 */
	public $args;

	/**
	 */
	public function setUp() {
		$this->updateStatus('Started');
		chdir(BASE_PATH);
	}

	/**
	 * @global array $databaseConfig
	 */
	public function tearDown() {
		$this->updateStatus('Finished');
		chdir(BASE_PATH);
	}

	/**
	 */
	public function perform() {
		echo "[-] DeployJob starting" . PHP_EOL;
		$log = new DeploynautLogFile($this->args['logfile']);
		$DNProject = $this->DNData()->DNProjectList()->filter('Name', $this->args['projectName'])->First();
		$DNEnvironment = $DNProject->Environments()->filter('Name', $this->args['environmentName'])->First();
		// This is a bit icky, but there is no easy way of capturing a failed deploy by using the PHP Resque
		try {
			// Disallow concurrent deployments (don't rely on queuing implementation to restrict this)
			// Only consider deployments started in the last 30 minutes (older jobs probably got stuck)
			$runningDeployments = DNDeployment::get()
				->filter(array(
					'EnvironmentID' => $DNEnvironment->ID,
					'Status' => array('Queued', 'Started'),
					'Created:GreaterThan' => strtotime('-30 minutes')
				))
				->exclude('ID', $this->args['deploymentID']);

			if($runningDeployments->count()) {
				$runningDeployment = $runningDeployments->first();
				$log->write(sprintf(
					'[-] Error: another deployment is in progress (started at %s by %s)',
					$runningDeployment->dbObject('Created')->Nice(),
					$runningDeployment->Deployer()->Title
				));
				throw new RuntimeException(sprintf(
					'Another deployment is in progress (started at %s by %s)',
					$runningDeployment->dbObject('Created')->Nice(),
					$runningDeployment->Deployer()->Title
				));
			}

			$DNEnvironment->Backend()->deploy(
				$DNEnvironment,
				$log,
				$DNProject,
				// Pass all args to give the backend full visibility. These args also contain
				// all options from the DeploymentStrategy merged in, including sha.
				$this->args
			);
		} catch(Exception $e) {
			$this->updateStatus('Failed');
			echo "[-] DeployJob failed" . PHP_EOL;
			throw $e;
		}
		echo "[-] DeployJob finished" . PHP_EOL;
	}

	/**
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
	 * @return DNData
	 */
	protected function DNData() {
		return DNData::inst();
	}
}
