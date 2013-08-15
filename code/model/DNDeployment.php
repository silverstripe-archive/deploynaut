<?php

/**
 * Class representing a single deplyoment (passed or failed) at a time to a particular environment
 */
class DNDeployment extends DataObject {

	private static $db = array(
		"SHA" => "Varchar(255)",
	);
	private static $has_one = array(
		"Environment" => "DNEnvironment",
		"Deployer" =>"Member", 
	);

	protected $dnData;
	protected $environment;
	protected $sha;
	protected $identifier;

	function Link() {
		return Controller::join_links($this->Environment()->Link(), 'deploy', $this->ID);
	}

	function canView($member = null) {
		return $this->Environment()->canView($member);
	}

	protected function logfile() {
		$environment = $this->Environment();
		$project = $environment->Project();
		return $project->Name.'.'.$environment->Name.'.'.$this->ID.'.log';
	}

	function log() {
		return new DeploynautLogFile($this->logfile());
	}

	function start() {
		$environment = $this->Environment();
		$project = $environment->Project();

		$args = array(
			'environment' => $environment->Name,
			'sha' => $this->SHA,
			'repository' => $project->LocalCVSPath,
			'logfile' => $this->logfile(),
			'projectName' => $project->Name,
			'env' => $project->getProcessEnv()
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

		$token = Resque::enqueue('deploy', 'DeployJob', $args);

		$message = 'Deploy queued as job ' . $token;
		$log->write($message);
	}
}