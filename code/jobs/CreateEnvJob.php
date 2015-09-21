<?php
class CreateEnvJob {

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
		echo "[-] CreateEnvJob starting" . PHP_EOL;
		$log = new DeploynautLogFile($this->args['logfile']);
		$project = $this->DNData()->DNProjectList()->filter('Name', $this->args['projectName'])->first();
		// This is a bit icky, but there is no easy way of capturing a failed deploy by using the PHP Resque
		try {
			// Disallow concurrent deployments (don't rely on queuing implementation to restrict this)
			// Only consider deployments started in the last 30 minutes (older jobs probably got stuck)
			$running = DNCreateEnvironment::get()
				->filter(array(
					'ProjectID' => $project->ID,
					'Status' => array('Queued', 'Started'),
					'Created:GreaterThan' => strtotime('-30 minutes')
				))
				->exclude('ID', $this->args['createID']);

			
			if($running->count()) {
				$existing = $running->first();
				$log->write(sprintf(
					'[-] Error: another create job is in progress (started at %s by %s)',
					$existing->dbObject('Created')->Nice(),
					$existing->Creator()->Title
				));
				throw new RuntimeException(sprintf(
					'Another create job is in progress (started at %s by %s)',
					$existing->dbObject('Created')->Nice(),
					$existing->Creator()->Title
				));
			}
			
			$envCreate = DNCreateEnvironment::get()->byId($this->args['createID']);
			if(!($envCreate && $envCreate->exists())) {
				throw new RuntimeException(sprintf('Could not find create environment record %s', $args['createID']));
			}

			// This will throw and exception if it fails.
			$envCreate->createEnvironment();

		} catch(Exception $e) {
			$this->updateStatus('Failed');
			echo "[-] CreateEnvJob failed" . PHP_EOL;
			throw $e;
		}
		echo "[-] CreateEnvJob finished" . PHP_EOL;
	}

	/**
	 *
	 * @param string $status
	 * @global array $databaseConfig
	 */
	protected function updateStatus($status) {
		global $databaseConfig;
		DB::connect($databaseConfig);

		$record = DNCreateEnvironment::get()->byID($this->args['createID']);
		$record->Status = $status;
		$record->write();
	}

	/**
	 *
	 * @return DNData
	 */
	protected function DNData() {
		return DNData::inst();
	}
}

