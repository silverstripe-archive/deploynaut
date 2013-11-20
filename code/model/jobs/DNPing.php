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
	 * @var DNData
	 */
	protected $dnData;
	
	/**
	 *
	 * @var type 
	 */
	protected $environment;
	
	/**
	 *
	 * @var type 
	 */
	protected $identifier;

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
	 * 
	 * @return string
	 */
	protected function logfile() {
		$environment = $this->Environment();
		$project = $environment->Project();
		return $project->Name.'.'.$environment->Name.'.ping.'.$this->ID.'.log';
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

		$args = array(
			'environment' => $environment->Name,
			'logfile' => $this->logfile(),
			'projectName' => $project->Name,
			'env' => $project->getProcessEnv()
		);

		$log = $this->log();
		$log->write('Pinging  "'.$args['projectName'].':'.$args['environment'].'"');

		if(!$this->DeployerID) {
			$this->DeployerID = Member::currentUserID();
		}
		
		if($this->DeployerID) {
			$deployer = $this->Deployer();
			$message = sprintf(
				'Ping to %s:%s initiated by %s (%s)',
				$args['projectName'],
				$args['environment'],
				$deployer->getName(),
				$deployer->Email
			);
			$log->write($message);
		}

		$token = Resque::enqueue('deploy', 'PingJob', $args, true);
		$this->ResqueToken = $token;
		$this->write();

		$message = 'Ping queued as job ' . $token;
		$log->write($message);
	}
}
