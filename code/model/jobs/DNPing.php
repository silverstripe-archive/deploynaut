<?php
/**
 * This class will queue a ping job and also proxy to the log file of that output
 */
class DNPing extends DataObject {

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
		"Environment" => "DNEnvironment",
		"Deployer" =>"Member",
	);

	/**
	 *
	 * @return string
	 */
	public function Link() {
		return Controller::join_links($this->Environment()->Link(), 'ping', $this->ID);
	}

	/**
	 *
	 * @return string
	 */
	public function LogLink() {
		return $this->Link() . '/log';
	}

	/**
	 *
	 * @param Member $member
	 * @return bool
	 */
	public function canView($member = null) {
		return $this->Environment()->canView($member);
	}

	/**
	 * Return a path to the log file.
	 * @return string
	 */
	protected function logfile() {
		return sprintf(
			'%s.ping.%s.log',
			$this->Environment()->getFullName('.'),
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

	/**
	 * Queue a ping job
	 *
	 */
	public function start() {
		$environment = $this->Environment();
		$project = $environment->Project();
		$log = $this->log();

		$args = array(
			'environmentName' => $environment->Name,
			'logfile' => $this->logfile(),
			'projectName' => $project->Name,
			'env' => $project->getProcessEnv()
		);

		if(!$this->DeployerID) {
			$this->DeployerID = Member::currentUserID();
		}

		if($this->DeployerID) {
			$deployer = $this->Deployer();
			$message = sprintf(
				'Ping to %s initiated by %s (%s)',
				$environment->getFullName(),
				$deployer->getName(),
				$deployer->Email
			);
			$log->write($message);
		}

		$token = Resque::enqueue('deploy', 'PingJob', $args, true);
		$this->ResqueToken = $token;
		$this->write();

		$message = sprintf('Ping queued as job %s', $token);
		$log->write($message);
	}
}
