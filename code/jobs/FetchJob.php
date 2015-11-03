<?php

class FetchJob {

	public $args;

	/**
	 * @var DNProject
	 */
	protected $project;

	/**
	 * @var DeploynautLogFile
	 */
	protected $log;

	/**
	 * @var string
	 */
	protected $user;

	/**
	 * @global array $databaseConfig
	 */
	public function setUp() {
		global $databaseConfig;
		DB::connect($databaseConfig);

		$this->updateStatus('Started');
		chdir(BASE_PATH);
	}

	public function tearDown() {
		$this->updateStatus('Finished');
		chdir(BASE_PATH);
	}

	public function perform() {
		set_time_limit(0);

		if(!empty($this->args['logfile'])) {
			$this->log = new DeploynautLogFile($this->args['logfile']);
		}

		$this->project = DNProject::get()->byId($this->args['projectID']);
		$this->user = DNData::inst()->getGitUser() ?: null;

		// Disallow concurrent git fetches on the same project.
		// Only consider fetches started in the last 30 minutes (older jobs probably got stuck)
		if(!empty($this->args['fetchID'])) {
			$runningFetches = DNGitFetch::get()
				->filter(array(
					'ProjectID' => $this->project->ID,
					'Status' => array('Queued', 'Started'),
					'Created:GreaterThan' => strtotime('-30 minutes')
				))
				->exclude('ID', $this->args['fetchID']);

			if($runningFetches->count()) {
				$runningFetch = $runningFetches->first();
				$message = sprintf(
					'Another fetch is in progress (started at %s by %s)',
					$runningFetch->dbObject('Created')->Nice(),
					$runningFetch->Deployer()->Title
				);
				if($this->log) {
					$this->log->write($message);
				}
				throw new RuntimeException($message);
			}
		}

		// Decide whether we need to just update what we already have
		// or initiate a clone if no local repo exists.
		try {
			if($this->project->repoExists() && empty($this->args['forceClone'])) {
				$this->fetchRepo();
			} else {
				$this->cloneRepo();
			}
		} catch(Exception $e) {
			$this->updateStatus('Failed');
			if($this->log) {
				$this->log->write($e->getMessage());
			}
			throw $e;
		}
	}

	protected function fetchRepo() {
		$this->runCommand(
			'git fetch -p origin +refs/heads/*:refs/heads/* --tags',
			$this->project->getLocalCVSPath()
		);
	}

	protected function cloneRepo() {
		if(file_exists($this->project->getLocalCVSPath())) {
			$this->runCommand(sprintf(
				'rm -rf %s',
				escapeshellarg($this->project->getLocalCVSPath())
			));
		}

		$this->runCommand(sprintf(
			'git clone --bare -q %s %s',
			escapeshellarg($this->project->CVSPath),
			escapeshellarg($this->project->getLocalCVSPath())
		));
	}

	/**
	 * Run a shell command.
	 *
	 * @param string $command The command to run
	 * @param string|null $workingDir The working dir to run command in
	 * @throws RuntimeException
	 */
	protected function runCommand($command, $workingDir = null) {
		if(!empty($this->user)) {
			$command = sprintf('sudo -u %s %s', $this->user, $command);
		}
		if($this->log) {
			$this->log->write(sprintf('Running command: %s', $command));
		}
		$process = new \Symfony\Component\Process\Process($command, $workingDir);
		$process->setEnv($this->project->getProcessEnv());
		$process->setTimeout(1800);
		$process->run();
		if(!$process->isSuccessful()) {
			throw new RuntimeException($process->getErrorOutput());
		}
	}

	/**
	 * @param string $status
	 * @global array $databaseConfig
	 */
	protected function updateStatus($status) {
		global $databaseConfig;
		DB::connect($databaseConfig);

		if(!empty($this->args['fetchID'])) {
			$fetch = DNGitFetch::get()->byID($this->args['fetchID']);
			$fetch->Status = $status;
			$fetch->write();
		}
	}

}
