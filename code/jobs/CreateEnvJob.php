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
	 * @global array $databaseConfig
	 */
	public function tearDown() {
		$this->updateStatus('Finished');
		chdir(BASE_PATH);
	}

	public function onFailure(Exception $exception) {
		$this->updateStatus('Failed');
	}

	/**
	 *
	 */
	public function perform() {
		echo "[-] CreateEnvJob starting" . PHP_EOL;
		// This is a bit icky, but there is no easy way of capturing a failed deploy by using the PHP Resque
		try {
			$envCreate = DNCreateEnvironment::get()->byId($this->args['createID']);
			if(!($envCreate && $envCreate->exists())) {
				throw new RuntimeException(sprintf('Could not find create environment record %s', $args['createID']));
			}

			// This will throw and exception if it fails.
			$envCreate->createEnvironment();

		} catch(Exception $e) {
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

