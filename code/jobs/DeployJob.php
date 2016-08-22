<?php

/**
 * Runs a deployment via the most appropriate backend
 */
class DeployJob extends DeploynautJob {

	/**
	 * @var array
	 */
	public $args;

	/**
	 * Poll the sigFile looking for a signal to self-deliver.
	 * This is useful if we don't know the PID of the worker - we can easily deliver signals
	 * if we only know the ClassName and ID of the DataObject.
	 */
	public function alarmHandler() {
		$sigFile = $this->args['sigFile'];
		if (file_exists($sigFile) && is_readable($sigFile) && is_writable($sigFile)) {
			$signal = (int)file_get_contents($sigFile);
			if (is_int($signal) && in_array((int)$signal, [
				// The following signals are trapped by both Resque and Rainforest.
				SIGTERM,
				SIGINT,
				SIGQUIT,
				// The following are Resque only.
				SIGUSR1,
				SIGUSR2,
				SIGCONT
			])) {
				echo sprintf(
					'[-] Signal "%s" received, delivering to own process group, PID "%s".' . PHP_EOL,
					$signal,
					getmypid()
				);

				// Mark the signal as received.
				unlink($sigFile);

				// Dispatch to own process group.
				$pgid = posix_getpgid(getmypid());
				if ($pgid<=0) {
					echo sprintf(
						'[-] Unable to send signal to invalid PGID "%s".' . PHP_EOL,
						$pgid
					);
				} else {
					posix_kill(-$pgid, $signal);
				}
			}
		}

		// Wake up again soon.
		pcntl_alarm(1);
	}

	public function setUp() {
		// Make this process a session leader so we can send signals
		// to this job as a whole (including any subprocesses such as spawned by Symfony).
		posix_setsid();

		if(function_exists('pcntl_alarm') && function_exists('pcntl_signal')) {
			if (!empty($this->args['sigFile'])) {
				echo sprintf('[-] Signal file requested, polling "%s".' . PHP_EOL, $this->args['sigFile']);
				declare(ticks = 1);
				pcntl_signal(SIGALRM, [$this, 'alarmHandler']);
				pcntl_alarm(1);
			}
		}

		$this->updateStatus(DNDeployment::TR_DEPLOY);
		chdir(BASE_PATH);
	}

	public function perform() {
		echo "[-] DeployJob starting" . PHP_EOL;
		$log = new DeploynautLogFile($this->args['logfile']);

		$deployment = DNDeployment::get()->byID($this->args['deploymentID']);
		$environment = $deployment->Environment();
		$currentBuild = $environment->CurrentBuild();
		$project = $environment->Project();
		$backupDataTransfer = null;
		$backupMode = !empty($this->args['backup_mode']) ? $this->args['backup_mode'] : 'db';

		// Perform pre-deploy backup here if required. Note that the backup is done here within
		// the deploy job, so that the order of backup is done before deployment, and so it
		// doesn't tie up another worker. It also puts the backup output into
		// the same log as the deployment so there is visibility on what is going on.
		// Note that the code has to be present for a backup to be performed, so the first
		// deploy onto a clean environment will not be performing any backup regardless of
		// whether the predeploy_backup option was passed or not.
		// Sometimes predeploy_backup comes through as string false from the frontend.
		if(
			!empty($this->args['predeploy_backup'])
			&& $this->args['predeploy_backup'] !== 'false'
			&& !empty($currentBuild)
		) {
			$backupDataTransfer = DNDataTransfer::create();
			$backupDataTransfer->EnvironmentID = $environment->ID;
			$backupDataTransfer->Direction = 'get';
			$backupDataTransfer->Mode = $backupMode;
			$backupDataTransfer->ResqueToken = $deployment->ResqueToken;
			$backupDataTransfer->AuthorID = $deployment->DeployerID;
			$backupDataTransfer->write();

			$deployment->BackupDataTransferID = $backupDataTransfer->ID;
			$deployment->write();
		}

		// This is a bit icky, but there is no easy way of capturing a failed deploy by using the PHP Resque
		try {
			// Disallow concurrent deployments (don't rely on queuing implementation to restrict this)
			// Only consider deployments started in the last 30 minutes (older jobs probably got stuck)
			$runningDeployments = $environment->runningDeployments()->exclude('ID', $this->args['deploymentID']);
			if($runningDeployments->count()) {
				$runningDeployment = $runningDeployments->first();
				$message = sprintf(
					'Error: another deployment is in progress (started at %s by %s)',
					$runningDeployment->dbObject('Created')->Nice(),
					$runningDeployment->Deployer()->Title
				);
				$log->write($message);
				throw new \RuntimeException($message);
			}

			$this->performBackup($backupDataTransfer, $log);
			$environment->Backend()->deploy(
				$environment,
				$log,
				$project,
				// Pass all args to give the backend full visibility. These args also contain
				// all options from the DeploymentStrategy merged in, including sha.
				$this->args
			);
		} catch(Exception $e) {
			// DeploynautJob will automatically trigger onFailure.
			echo "[-] DeployJob failed" . PHP_EOL;
			throw $e;
		}

		$this->updateStatus(DNDeployment::TR_COMPLETE);
		echo "[-] DeployJob finished" . PHP_EOL;
	}

	public function onFailure(Exception $exception) {
		$this->updateStatus(DNDeployment::TR_FAIL);
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
	 * @param string $status Transition
	 * @global array $databaseConfig
	 */
	protected function updateStatus($status) {
		global $databaseConfig;
		DB::connect($databaseConfig);
		$deployment = DNDeployment::get()->byID($this->args['deploymentID']);
		$deployment->getMachine()->apply($status);
	}

	/**
	 * @return DNData
	 */
	protected function DNData() {
		return DNData::inst();
	}
}
