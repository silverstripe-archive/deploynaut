<?php
class DNCreateEnvironment extends DataObject {

	private static $db = array(
		'Data' => 'Text',
		'ResqueToken' => 'Varchar(255)',
		"Status" => "Enum('Queued, Started, Finished, Failed, n/a', 'n/a')",
	);

	private static $has_one = array(
		'Environment' => 'DNEnvironment',
		'Creator' => 'Member'
	);

	/**
	 *
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

	public function Link() {
		return Controller::join_links($this->Environment()->Project()->Link(), 'createenv', $this->ID);
	}

	public function LogLink() {
		return $this->Link() . '/log';
	}

	public function canView($member = null) {
		return $this->Environment()->Project()->canView($member);
	}

	/**
	 * Return a path to the log file.
	 * @return string
	 */
	protected function logfile() {
		return sprintf(
			'%s.createenv.%s.log',
			$this->Environment()->Project()->Name,
			$this->ID
		);
	}

	/**
	 * @return DeploynautLogFile
	 */
	public function log() {
		return Injector::inst()->createWithArgs('DeploynautLogFile', array($this->logfile()));
	}

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

	/**
	 * Start a resque job for this creation.
	 *
	 * @return string Resque token
	 */
	protected function enqueueCreation() {
		$project = $this->Environment()->Project();
		$log = $this->log();

		$args = array(
			'createID' => $this->ID,
			'logfile' => $this->logfile(),
			'envName' => $this->Environment()->Name,
			'projectName' => $project->Name
		);

		if(!$this->CreatorID) {
			$this->CreatorID = Member::currentUserID();
		}

		if($this->CreatorID) {
			$creator = $this->Creator();
			$message = sprintf(
				'Environment creation for project %s initiated by %s (%s), with IP address %s',
				$project->Name,
				$creator->getName(),
				$creator->Email,
				Controller::curr()->getRequest()->getIP()
			);
			$log->write($message);
		}

		return Resque::enqueue('create', 'CreateEnvJob', $args, true);
	}

	public function start() {
		$log = $this->log();
		$token = $this->enqueueCreation();
		$this->ResqueToken = $token;
		$this->Status = 'Queued';
		$this->write();

		$message = sprintf('Environment creation queued as job %s', $token);
		$log->write($message);
	}

}
