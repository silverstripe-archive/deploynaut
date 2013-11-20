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
		"Status" => "Enum('Queued, Started, Finished, Failed', 'Queued')",
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

	protected $dnData;
	protected $environment;
	protected $sha;
	protected $identifier;

	public function Link() {
		return Controller::join_links($this->Environment()->Link(), 'deploy', $this->ID);
	}
	public function LogLink() {
		return $this->Link() . '/log';
	}

	public function canView($member = null) {
		return $this->Environment()->canView($member);
	}

	protected function logfile() {
		$environment = $this->Environment();
		$project = $environment->Project();
		return $project->Name.'.'.$environment->Name.'.'.$this->ID.'.log';
	}

	public function log() {
		return new DeploynautLogFile($this->logfile());
	}
	public function LogContent() {
		return $this->log()->content();
	}

	public function ResqueStatus() {
		$status = new Resque_Job_Status($this->ResqueToken);
		return self::map_resque_status($status->get());
	}

	public function start() {
		$environment = $this->Environment();
		$project = $environment->Project();

		$args = array(
			'environment' => $environment->Name,
			'sha' => $this->SHA,
			'repository' => $project->LocalCVSPath,
			'logfile' => $this->logfile(),
			'projectName' => $project->Name,
			'env' => $project->getProcessEnv(),
			'deploymentID' => $this->ID,
		);

		$log = $this->log();
		$log->write('Deploying "'.$args['sha'].'" to "'.$args['projectName'].':'.$args['environment'].'"');

		if(!$this->DeployerID) $this->DeployerID = Member::currentUserID();
		if($this->DeployerID) {
			$deployer = $this->Deployer();
			$message = sprintf(
				'Deploy to %s:%s initiated by %s (%s)',
				$args['projectName'],
				$args['environment'],
				$deployer->getName(),
				$deployer->Email
			);
			$log->write($message);
		}

		$token = Resque::enqueue('deploy', 'DeployJob', $args, true);
		$this->ResqueToken = $token;
		$this->write();

		$message = 'Deploy queued as job ' . $token;
		$log->write($message);
	}
}
