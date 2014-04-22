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
		$project = $this->DNData()->DNProjectList()->filter('Name', $this->args['projectName'])->First();
		$dataTransfer = DNDataTransfer::get()->byID($this->args['dataTransferID']);
		$environment = $dataTransfer->Environment();
		$backupJob = null;

		if($dataTransfer->Direction == 'push') {
			$backupJob = new DNDataTransfer();
			$backupJob->EnvironmentID = $environment->ID;
			$backupJob->Direction = 'get';
			$backupJob->Mode = $dataTransfer->Mode;
			$backupJob->DataArchiveID = null;
			$backupJob->ResqueToken = $dataTransfer->ResqueToken;
			$backupJob->AuthorID = $dataTransfer->AuthorID;
			$backupJob->write();

			$dataTransfer->BackupDataTransferID = $backupJob->ID;
			$dataTransfer->write();
		}

		// This is a bit icky, but there is no easy way of capturing a failed run by using the PHP Resque 
		try {
			// Disallow concurrent jobs (don't rely on queuing implementation to restrict this)
			$runningTransfers = DNDataTransfer::get()
				->filter(array('EnvironmentID' => $environment->ID, 'Status' => array('Queued', 'Started')))
				->exclude('ID', $dataTransfer->ID);

			if($runningTransfers->count()) {
				$runningTransfer = $runningTransfers->First();
				throw new RuntimeException(sprintf(
					'[-] Error: another transfer seems to be already in progress (started at %s by %s)',
					$runningTransfer->dbObject('Created')->Nice(),
					$runningTransfer->Author()->Title
				));
			}

			// before we push data to an environment, we'll make a backup first
			if($backupJob) {
				$log->write('Backing up existing data');
				$this->DNData()->Backend()->dataTransfer(
					$backupJob,
					$log
				);
			}

			$this->DNData()->Backend()->dataTransfer(
				$dataTransfer,
				$log
			);
		} catch(RuntimeException $exc) {
			$log->write($exc->getMessage());

			if($backupJob) {
				$backupJob->Status = 'Failed';
				$backupJob->write();
			}

			$this->updateStatus('Failed');
			echo "[-] DataTransferJob failed" . PHP_EOL;
			throw $exc;
		}

		if($backupJob) {
			$backupJob->Status = 'Finished';
			$backupJob->write();
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
