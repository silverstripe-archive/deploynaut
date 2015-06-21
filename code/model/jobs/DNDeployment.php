<?php

/**
 * Class representing a single deplyoment (passed or failed) at a time to a particular environment
 */
class DNDeployment extends DataObject {

	/**
	 *
	 * @var array
	 */
	private static $db = array(
		"SHA" => "Varchar(255)",
		"ResqueToken" => "Varchar(255)",
		// Observe that this is not the same as Resque status, since ResqueStatus is not persistent
		// It's used for finding successful deployments and displaying that in history views in the frontend
		"Status" => "Enum('Queued, Started, Finished, Failed, n/a', 'n/a')",
		"LeaveMaintenacePage" => "Boolean"
	);

	/**
	 *
	 * @var array
	 */
	private static $has_one = array(
		"Environment" => "DNEnvironment",
		"Deployer" => "Member",
	);

	private static $default_sort = '"LastEdited" DESC';

	public function getTitle() {
		return "#{$this->ID}: {$this->SHA} (Status: {$this->Status})";
	}

	private static $summary_fields = array(
		'LastEdited' => 'Last Edited',
		'SHA' => 'SHA',
		'Status' => 'Status',
		'Deployer.Name' => 'Deployer'
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
		return Controller::join_links($this->Environment()->Link(), 'deploy', $this->ID);
	}

	public function LogLink() {
		return $this->Link() . '/log';
	}

	public function canView($member = null) {
		return $this->Environment()->canView($member);
	}

	/**
	 * Return a path to the log file.
	 * @return string
	 */
	protected function logfile() {
		return sprintf(
			'%s.%s.log',
			$this->Environment()->getFullName('.'),
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

	public function ResqueStatus() {
		$status = new Resque_Job_Status($this->ResqueToken);
		return self::map_resque_status($status->get());
	}

	/**
	 * Start a resque job for this deployment
	 *
	 * @return string Resque token
	 */
	protected function enqueueDeployment() {
		$environment = $this->Environment();
		$project = $environment->Project();

		$args = array(
			'environmentName' => $environment->Name,
			'sha' => $this->SHA,
			'repository' => $project->LocalCVSPath,
			'logfile' => $this->logfile(),
			'projectName' => $project->Name,
			'env' => $project->getProcessEnv(),
			'deploymentID' => $this->ID,
			'leaveMaintenacePage' => $this->LeaveMaintenacePage
		);

		$log = $this->log();
		$log->write(sprintf('Deploying %s to "%s"', $args['sha'], $environment->getFullName()));

		if(!$this->DeployerID) {
			$this->DeployerID = Member::currentUserID();
		}

		if($this->DeployerID) {
			$deployer = $this->Deployer();
			$message = sprintf(
				'Deploy to %s:%s initiated by %s (%s)',
				$args['projectName'],
				$args['environmentName'],
				$deployer->getName(),
				$deployer->Email
			);
			$log->write($message);
		}

		return Resque::enqueue('deploy', 'DeployJob', $args, true);
	}

	public function start() {
		$log = $this->log();
		$token = $this->enqueueDeployment();
		$this->ResqueToken = $token;
		$this->Status = 'Queued';
		$this->write();

		$message = sprintf('Deploy queued as job %s', $token);
		$log->write($message);
	}
}
