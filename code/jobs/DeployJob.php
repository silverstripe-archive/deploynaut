<?php

/**
 * Runs a deployment via the most appropriate backend
 */
class DeployJob extends DeploynautJob {

	/**
	 * @var array
	 */
	public $args;

	public static function sig_file_for_data_object($dataObject) {
		$dir = DNData::inst()->getSignalDir();
		if (!is_dir($dir)) {
			`mkdir $dir`;
		}
		return sprintf(
			'%s/deploynaut-signal-%s-%s',
			DNData::inst()->getSignalDir(),
			$dataObject->ClassName,
			$dataObject->ID
		);
	}

	/**
	 * Signal the worker to self-abort. If we had a reliable way of figuring out the right PID,
	 * we could posix_kill directly, but Resque seems to not provide a way to find out the PID
	 * from the job nor worker.
	 */
	public static function set_signal($dataObject, $signal) {
		$sigFile = DeployJob::sig_file_for_data_object($dataObject);
		// 2 is SIGINT - we can't use SIGINT constant in the Apache context, only available in workers.
		file_put_contents($sigFile, $signal);
	}

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

	/**
	 * @param string $status Transition
	 * @global array $databaseConfig
	 */
	protected function updateStatus($status) {
		global $databaseConfig;
		DB::connect($databaseConfig);
		$dnDeployment = DNDeployment::get()->byID($this->args['deploymentID']);
		$dnDeployment->getMachine()->apply($status);
	}

	/**
	 * @return DNData
	 */
	protected function DNData() {
		return DNData::inst();
	}
}
