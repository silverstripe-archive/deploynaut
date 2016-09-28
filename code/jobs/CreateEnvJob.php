<?php
class CreateEnvJob extends DeploynautJob {

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
	 */
	public function perform() {
		echo "[-] CreateEnvJob starting" . PHP_EOL;
		$log = new DeploynautLogFile($this->args['logfile']);
		$envCreate = DNCreateEnvironment::get()->byId($this->args['createID']);

		try {
			if(!($envCreate && $envCreate->exists())) {
				throw new RuntimeException(sprintf('Could not find create environment record %s', $args['createID']));
			}

			// This will throw and exception if it fails.
			$envCreate->createEnvironment();

		} catch(Exception $e) {
			$log->write($e->getMessage());
			echo "[-] CreateEnvJob failed" . PHP_EOL;
			throw $e;
		}

		$this->updateStatus('Finished');
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

