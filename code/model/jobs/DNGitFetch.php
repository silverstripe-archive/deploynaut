<?php

/**
 * Class DNGitFetch
 *
 * @property string $ResqueToken
 *
 * @method DNProject Project()
 * @property int $ProjectID
 * @method Member Deployer()
 * @property int $DeployerID
 *
 */
class DNGitFetch extends DataObject {

	/**
	 * @var array
	 */
	private static $db = array(
		"ResqueToken" => "Varchar(255)",
		// Observe that this is not the same as Resque status, since ResqueStatus is not persistent
		// It's used for finding successful deployments and displaying that in history views in the frontend
		"Status" => "Enum('Queued, Started, Finished, Failed, n/a', 'n/a')",
	);

	/**
	 * @var array
	 */
	private static $has_one = array(
		"Project" => "DNProject",
		"Deployer" => "Member"
	);

	/**
	 * @param int $int
	 * @return string
	 */
	public static function map_resque_status($int) {
		$remap = array(
			Resque_Job_Status::STATUS_WAITING => "Queued",
			Resque_Job_Status::STATUS_RUNNING => "Running",
			Resque_Job_Status::STATUS_FAILED => "Failed",
			Resque_Job_Status::STATUS_COMPLETE => "Complete",
			false => "Invalid",
		);
		return $remap[$int];
	}

	/**
	 * Queue a fetch job
	 * @param bool $forceClone Force repository to be re-cloned
	 */
	public function start($forceClone = false) {
		$project = $this->Project();
		$log = $this->log();

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

		// write first, so we have the ID. We have to write again
		// later once we have the resque token.
		$this->write();

		$args = array(
			'projectID' => $project->ID,
			'logfile' => $this->logfile(),
			'fetchID' => $this->ID,
			'forceClone' => $forceClone
		);

		$token = Resque::enqueue('git', 'FetchJob', $args, true);
		$this->ResqueToken = $token;
		$this->write();

		$message = sprintf('Fetch queued as job %s', $token);
		$log->write($message);
	}

	/**
	 * @param Member|null $member
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
	 * @return \DeploynautLogFile
	 */
	public function log() {
		return new DeploynautLogFile($this->logfile());
	}

	/**
	 * @return string
	 */
	public function LogContent() {
		return $this->log()->content();
	}

	/**
	 * Returns the status of the resque job
	 *
	 * @return string
	 */
	public function ResqueStatus() {
		$status = new Resque_Job_Status($this->ResqueToken);
		$statusCode = $status->get();
		// The Resque job can no longer be found, fallback to the DNDeployment.Status
		if($statusCode === false) {
			// Translate from the DNDeployment.Status to the Resque job status for UI purposes
			switch($this->Status) {
				case 'Finished':
					return 'Complete';
				case 'Started':
					return 'Running';
				default:
					return $this->Status;
			}
		}
		return self::map_resque_status($statusCode);
	}

}
