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

		if(
			!empty($this->args['backupBeforePush'])
			&& $this->args['backupBeforePush'] !== 'false'
			&& $dataTransfer->Direction == 'push'
		) {
			$backupDataTransfer = DNDataTransfer::create();
			$backupDataTransfer->EnvironmentID = $environment->ID;
			$backupDataTransfer->Direction = 'get';
			$backupDataTransfer->Mode = $dataTransfer->Mode;
			$backupDataTransfer->ResqueToken = $dataTransfer->ResqueToken;
			$backupDataTransfer->AuthorID = $dataTransfer->AuthorID;
			$backupDataTransfer->write();

			$dataTransfer->BackupDataTransferID = $backupDataTransfer->ID;
			$dataTransfer->write();
		}

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

			$this->performBackup($backupDataTransfer, $log);
			$environment->Backend()->dataTransfer($dataTransfer, $log);
		} catch(Exception $e) {
			echo "[-] DataTransferJob failed" . PHP_EOL;
			throw $e;
		}

		$this->updateStatus('Finished');
		echo "[-] DataTransferJob finished" . PHP_EOL;
	}

	protected function performBackup($backupDataTransfer, DeploynautLogFile $log) {
		if (!$backupDataTransfer) {
			return false;
		}

		$log->write('Backing up existing data');
		try {
			$backupDataTransfer->Environment()->Backend()->dataTransfer($backupDataTransfer, $log);
			global $databaseConfig;
			DB::connect($databaseConfig);
			$backupDataTransfer->Status = 'Finished';
			$backupDataTransfer->write();
		} catch(Exception $e) {
			global $databaseConfig;
			DB::connect($databaseConfig);
			$backupDataTransfer->Status = 'Failed';
			$backupDataTransfer->write();
			throw $e;
		}
	}

	/**
	 * @param string $status
	 * @global array $databaseConfig
	 */
	protected function updateStatus($status) {
		global $databaseConfig;
		DB::connect($databaseConfig);
		$transfer = DNDataTransfer::get()->byID($this->args['dataTransferID']);
		$transfer->Status = $status;
		$transfer->write();
	}

	/**
	 * @return DNData
	 */
	protected function DNData() {
		return DNData::inst();
	}
}
