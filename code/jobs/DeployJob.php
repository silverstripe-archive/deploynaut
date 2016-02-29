<?php

/**
 * Runs a deployment via the most appropriate backend
 */
class DeployJob extends DeploynautJob {

	/**
	 * @var array
	 */
	public $args;

	public function setUp() {
		$this->updateStatus('Started');
		chdir(BASE_PATH);
	}

	public function onFailure(Exception $exception) {
		$this->updateStatus('Failed');
	}

	public function perform() {
		echo "[-] DeployJob starting" . PHP_EOL;
		$log = new DeploynautLogFile($this->args['logfile']);

		$deployment = DNDeployment::get()->byID($this->args['deploymentID']);
		$environment = $deployment->Environment();
		$project = $environment->Project();
		// This is a bit icky, but there is no easy way of capturing a failed deploy by using the PHP Resque
		try {
			// Disallow concurrent deployments (don't rely on queuing implementation to restrict this)
			// Only consider deployments started in the last 30 minutes (older jobs probably got stuck)
			$runningDeployments = $environment->runningDeployments()->exclude('ID', $this->args['deploymentID']);
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

			$environment->Backend()->deploy(
				$environment,
				$log,
				$project,
				// Pass all args to give the backend full visibility. These args also contain
				// all options from the DeploymentStrategy merged in, including sha.
				$this->args
			);
		} catch(Exception $e) {
			echo "[-] DeployJob failed" . PHP_EOL;
			throw $e;
		}
		$this->updateStatus('Finished');
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
