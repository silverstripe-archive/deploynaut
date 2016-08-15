<?php

/**
 * Starts a capistrano script for either retrieving data from an environment,
 * or pushing data into an environment. Initiated by {@link DNDataTransfer}.
 *
 * @package deploynaut
 * @subpackage jobs
 */
class DataTransferJob extends DeploynautJob {

	/**
	 * set by a resque worker
	 */
	public $args = array();

	public function setUp() {
		$this->updateStatus('Started');
		chdir(BASE_PATH);
	}

	public function perform() {
		echo "[-] DataTransferJob starting" . PHP_EOL;
		$log = new DeploynautLogFile($this->args['logfile']);
		$dataTransfer = DNDataTransfer::get()->byID($this->args['dataTransferID']);
		$environment = $dataTransfer->Environment();
		$backupDataTransfer = null;

		if(!empty($this->args['backupBeforePush']) && $dataTransfer->Direction == 'push') {
			$backupDataTransfer = DNDataTransfer::create();
			$backupDataTransfer->EnvironmentID = $environment->ID;
			$backupDataTransfer->Direction = 'get';
			$backupDataTransfer->Mode = $dataTransfer->Mode;
			$backupDataTransfer->DataArchiveID = null;
			$backupDataTransfer->ResqueToken = $dataTransfer->ResqueToken;
			$backupDataTransfer->AuthorID = $dataTransfer->AuthorID;
			$backupDataTransfer->write();

			$dataTransfer->BackupDataTransferID = $backupDataTransfer->ID;
			$dataTransfer->write();
		}

		// This is a bit icky, but there is no easy way of capturing a failed run by using the PHP Resque
		try {
			// Disallow concurrent jobs (don't rely on queuing implementation to restrict this)
			// Only consider data transfers started in the last 30 minutes (older jobs probably got stuck)
			$runningTransfers = DNDataTransfer::get()
				->filter(array(
					'EnvironmentID' => $environment->ID,
					'Status' => array('Queued', 'Started'),
					'Created:GreaterThan' => strtotime('-30 minutes')
				))
				->exclude('ID', $dataTransfer->ID);

			if($runningTransfers->count()) {
				$runningTransfer = $runningTransfers->first();
				$message = sprintf(
					'Error: another transfer is in progress (started at %s by %s)',
					$runningTransfer->dbObject('Created')->Nice(),
					$runningTransfer->Author()->Title
				);
				$log->write($message);
				throw new \RuntimeException($message);
			}

			// before we push data to an environment, we'll make a backup first
			if($backupDataTransfer) {
				$log->write('Backing up existing data');
				$environment->Backend()->dataTransfer(
					$backupDataTransfer,
					$log
				);
			}

			$environment->Backend()->dataTransfer(
				$dataTransfer,
				$log
			);
		} catch(RuntimeException $exc) {
			$log->write($exc->getMessage());

			echo "[-] DataTransferJob failed" . PHP_EOL;
			throw $exc;
		}

		$this->updateStatus('Finished');
		echo "[-] DataTransferJob finished" . PHP_EOL;
	}

	/**
	 * @param string $status
	 * @global array $databaseConfig
	 */
	protected function updateStatus($status) {
		global $databaseConfig;
		DB::connect($databaseConfig);
		$env = DNDataTransfer::get()->byID($this->args['dataTransferID']);
		$env->Status = $status;
		$env->write();

		$backup = $env->BackupDataTransfer();
		if($backup && $backup->exists()) {
			$backup->Status = $status;
			$backup->write();
		}
	}

	/**
	 * @return DNData
	 */
	protected function DNData() {
		return DNData::inst();
	}
}
