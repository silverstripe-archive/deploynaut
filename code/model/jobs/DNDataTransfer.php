<?php

/**
 * Class representing a single data transfer in a project,
 * which can include a database export, an archive of all assets, or both.
 * 
 * It can be one of two directions:
 * - Backup: Package up data on an environment and store it in a local file
 * - Restore: Transfer data from a local file into an environment, extract assets and/or restore a database
 *
 * The choice of database and/or assets is represented in the "Mode".
 * There's always one file archive involved (stored in "Filepath") on the local Deploynaut environment.
 *
 * Each transfer is executed by a Resque job, so the model also contains
 * a reference to a Resque token (which might still be in progress).
 */
class DNDataTransfer extends DataObject {

	private static $db = array(
		"ResqueToken" => "Varchar(255)",
		// Observe that this is not the same as Resque status, since ResqueStatus is not persistent.
		"Status" => "Enum('Queued, Started, Finished, Failed, n/a', 'n/a')",
		"Direction" => "Enum('get, push', 'get')",
		"Mode" => "Enum('all, assets, database', '')",
	);
	
	private static $has_one = array(
		"Environment" => "DNEnvironment",
		"Author" => "Member",
	);

	public function Link() {
		return Controller::join_links($this->Environment()->Link(), 'transfer', $this->ID);
	}

	/**
	 * Queue a tramsfer job
	 */
	public function start() {
		$env = $this->Environment();
		$project = $env->Project();

		$args = array(
			'projectName' => $project->Name,
			'logfile' => $this->logfile(),
			'env' => $env->Name,
			'direction' => $this->Direction,
			'mode' => $this->Mode
		);

		$log = $this->log();
		$log->write(strtr(
			'Creating a job to transfer data on environment "<proj>:<env>" (direction: <dir>, mode: <mode>)',
			array(
				'<dir>' => $this->Direction,
				'<mode>' => $this->Mode,
				'<env>' => $env->Name,
				'<proj>' => $project->Name
			)
		));

		if(!$this->AuthorID) {
			$this->AuthorID = Member::currentUserID();
		}
		
		if($this->AuthorID) {
			$author = $this->Author();
			$message = sprintf(
				'Initiated by %s (%s)',
				$author->getName(),
				$author->Email
			);
			$log->write($message);
		}

		$token = Resque::enqueue('git', 'DataTransferJob', $args, true);
		$this->ResqueToken = $token;
		$this->write();

		$message = 'job queued as ' . $token;
		$log->write($message);
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
		$project = $this->Environment()->Project();
		return $project->Name.'.datatransfer.'.$this->ID.'.log';
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