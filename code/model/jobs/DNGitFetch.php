<?php

class DNGitFetch extends DataObject {
	
	/**
	 *
	 * @var array
	 */
	private static $db = array(
		"ResqueToken" => "Varchar(255)",
	);
	
	/**
	 *
	 * @var array
	 */
	private static $has_one = array(
		"Project" => "DNProject",
		"Deployer" =>"Member",
	);
	
	/**
	 * Queue a fetch job
	 */
	public function start() {
		$project = $this->Project();
		$log = $this->log();

		$args = array(
			'projectName' => $project->Name,
			'logfile' => $this->logfile(),
			'env' => $project->getProcessEnv()
		);

		if(!$this->DeployerID) {
			$this->DeployerID = Member::currentUserID();
		}

		if($this->DeployerID) {
			$deployer = $this->Deployer();
			$message = sprintf(
				'Update repository job for %s initiated by %s (%s)',
				$project->Name,
				$deployer->getName(),
				$deployer->Email
			);
			$log->write($message);
		}

		$token = Resque::enqueue('git', 'FetchJob', $args, true);
		$this->ResqueToken = $token;
		$this->write();

		$message = sprintf('Fetch queued as job %s', $token);
		$log->write($message);
	}
	
	/**
	 * 
	 * @param Member $member
	 * @return bool
	 */
	public function canView($member = null) {
		return $this->Project()->canView($member);
	}

	/**
	 * Return a path to the log file.
	 * @return string
	 */
	protected function logfile() {
		return sprintf(
			'%s.fetch.%s.log',
			$this->Project()->Name,
			$this->ID
		);
	}

	/**
	 * 
	 * @return \DeploynautLogFile
	 */
	public function log() {
		return new DeploynautLogFile($this->logfile());
	}
	
	/**
	 * 
	 * @return string
	 */
	public function LogContent() {
		return $this->log()->content();
	}

	/**
	 * 
	 * @return string
	 */
	public function ResqueStatus() {
		$status = new Resque_Job_Status($this->ResqueToken);

		$remap = array(
			Resque_Job_Status::STATUS_WAITING => "Queued",
			Resque_Job_Status::STATUS_RUNNING => "Running",
			Resque_Job_Status::STATUS_FAILED => "Failed",
			Resque_Job_Status::STATUS_COMPLETE => "Complete",
			false => "Invalid",
		);

		return $remap[$status->get()];
	}
}
