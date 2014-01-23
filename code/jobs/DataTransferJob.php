<?php
/**
 * Starts a capistrano script for either retrieving data from an environment,
 * or pushing data into an environment. Initiated by {@link DNDataTransfer}.
 */
class DataTransferJob {
	
	public function setUp() {
		$this->updateStatus('Started');
		chdir(BASE_PATH);
	}
	
	public function tearDown() {
		$this->updateStatus('Finished');
		chdir(BASE_PATH);
	}

	public function perform() {
		echo "[-] DataTransferJob starting" . PHP_EOL;
		$log = new DeploynautLogFile($this->args['logfile']);
		$DNProject = $this->DNData()->DNProjectList()->filter('Name', $this->args['projectName'])->First();
		$dataTransfer = DNDataTransfer::get()->byID($this->args['dataTransferID']);
		// This is a bit icky, but there is no easy way of capturing a failed run by using the PHP Resque 
		try {
			$this->DNData()->Backend()->dataTransfer(
				$dataTransfer,
				$log
			);
		} catch(RuntimeException $exc) {
			$this->updateStatus('Failed');
			echo "[-] DataTransferJob failed" . PHP_EOL;
			throw $exc;
		}
		echo "[-] DataTransferJob finished" . PHP_EOL;
	}

	/**
	 * 
	 * @param string $status
	 * @global array $databaseConfig
	 */
	protected function updateStatus($status) {
		global $databaseConfig;
		DB::connect($databaseConfig);
		$env = DNDataTransfer::get()->byID($this->args['dataTransferID']);
		$env->Status = $status;
		$env->write();
	}

	/**
	 * 
	 * @return DNData
	 */
	protected function DNData() {
		return Injector::inst()->get('DNData');
	}
}