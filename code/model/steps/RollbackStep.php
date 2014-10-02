<?php

/**
 * Peforms rollback of a pipeline to a previous status.
 *
 * Note that this step would usually only be used in the special conditional rollback situation configured
 * on the Pipeline itself - see the Pipeline documentation for details.
 *
 * <code>
 * RollbackStep1:
 *   Class: RollbackStep
 *   RestoreDB: true
 *   MaxDuration: 3600
 * </code>
 *
 * @method DNDeployment RollbackDeployment() The current rollback deployment
 */
class RollbackStep extends LongRunningPipelineStep {

	private static $db = array(
		'Doing' => "Enum('Deployment,Snapshot,Queued', 'Queued')"
	);

	private static $has_one = array(
		'RollbackDeployment' => 'DNDeployment',
		'RollbackDatabase' => 'DNDataTransfer'
	);

	public function getTitle() {
		// Make sure the title includes the subtask
		return parent::getTitle() . ":{$this->Doing}";
	}

	public function start() {
		parent::start();

		switch($this->Status) {
			case 'Started':
				// If we are doing a subtask, check which one to continue
				switch($this->Doing) {
					case 'Deployment':
						return $this->continueRevertDeploy();
					case 'Snapshot':
						return $this->continueRevertDatabase();
					default:
						$this->log("Unable to process {$this->Title} with subtask of {$this->Doing}");
						$this->markFailed();
						return false;
				}
			case 'Queued':
				// Begin rollback by initiating deployment
				return $this->startRevertDeploy();
			default:
				$this->log("Unable to process {$this->Title} with status of {$this->Status}");
				$this->markFailed();
				return false;
		}
	}

	/**
	 * Begin a new deployment
	 *
	 * @return boolean
	 */
	protected function startRevertDeploy() {
		$this->Status = 'Started';
		$this->Doing = 'Deployment';
		$this->log("{$this->Title} starting revert deployment");

		// Skip deployment for dry run
		if($this->Pipeline()->DryRun) {
			$this->log("[Skipped] Create DNDeployment");
			$this->write();
			return true;
		}

		// Get old deployment from pipeline
		$pipeline = $this->Pipeline();
		$previous = $pipeline->PreviousDeployment();
		if(empty($previous) || empty($previous->SHA)) {
			$this->log("No available SHA for {$this->Title}");
			$this->markFailed();
			return false;
		}

		// Initialise deployment
		$deployment = DNDeployment::create();
		// Leave the maintenance page up if we are restoring the DB
		$deployment->LeaveMaintenacePage = $this->doRestoreDB();
		$deployment->EnvironmentID = $pipeline->EnvironmentID;
		$deployment->SHA = $previous->SHA;
		$deployment->DeployerID = $pipeline->AuthorID;
		$deployment->write();
		$deployment->start();
		$this->RollbackDeploymentID = $deployment->ID;
		$this->write();

		return true;
	}

	/**
	 * Create a snapshot of the db and store the ID on the Pipline
	 *
	 * @return bool True if success
	 */
	protected function startRevertDatabase() {
		// Mark self as creating a snapshot
		$this->Status = 'Started';
		$this->Doing = 'Snapshot';
		$this->log("{$this->Title} reverting database from snapshot");

		// Skip deployment for dry run
		if($this->Pipeline()->DryRun) {
			$this->write();
			$this->log("[Skipped] Create DNDataTransfer restore");
			return true;
		}

		// Get snapshot
		$pipeline = $this->Pipeline();
		$backup = $pipeline->PreviousSnapshot();
		if(empty($backup) || !$backup->exists()) {
			$this->log("No database to revert for {$this->Title}");
			$this->markFailed();
			return false;
		}

		// Create restore job
		$job = DNDataTransfer::create();
		$job->EnvironmentID = $pipeline->EnvironmentID;
		$job->Direction = 'push';
		$job->Mode = 'db';
		$job->DataArchiveID = $backup->DataArchiveID;
		$job->AuthorID = $pipeline->AuthorID;
		$job->EnvironmentID = $pipeline->EnvironmentID;
		$job->write();
		$job->start();

		// Save rollback
		$this->RollbackDatabaseID = $job->ID;
		$this->write();
		return true;
	}

	/**
	 * Check status of current snapshot
	 */
	protected function continueRevertDatabase() {
		$this->log("Checking status of {$this->Title}...");

		// Skip snapshot for dry run
		if($this->Pipeline()->DryRun) {
			$this->log("[Skipped] Checking progress of snapshot restore");
			return $this->finish();
		}

		// Get related snapshot
		$transfer = $this->RollbackDatabase();
		if(empty($transfer) || !$transfer->exists()) {
			$this->log("Missing database transfer for in-progress {$this->Title}");
			$this->markFailed();
			return false;
		}

		// Check finished state
		$status = $transfer->ResqueStatus();
		if($this->checkResqueStatus($status)) {
			// Re-enable the site by disabling the maintenance, since the DB restored successfully
			$this->Pipeline()->Environment()->disableMaintenance($this->Pipeline()->getLogger());

			// After revert is complete we are done
			return $this->finish();
		}
	}

	/**
	 * Check status of deployment and finish task if complete, or fail if timedout
	 *
	 * @return boolean
	 */
	protected function continueRevertDeploy() {
		$this->log("Checking status of {$this->Title}...");

		// Skip deployment for dry run
		if($this->Pipeline()->DryRun) {
			$this->log("[Skipped] Checking progress of deployment");
			if($this->getConfigSetting('RestoreDB')) {
				return $this->startRevertDatabase();
			} else {
				$this->finish();
				return true;
			}
		}

		// Get related deployment
		$deployment = $this->RollbackDeployment();
		if(empty($deployment) || !$deployment->exists()) {
			$this->log("Missing deployment for in-progress {$this->Title}");
			$this->markFailed();
			return false;
		}

		// Check finished state
		$status = $deployment->ResqueStatus();
		if($this->checkResqueStatus($status)) {
			// Since deployment is finished, check if we should also do a db restoration
			if($this->doRestoreDB()) {
				return $this->startRevertDatabase();
			} else {
				$this->finish();
			}
		}
		return !$this->isFailed();
	}

	/**
	 * Check if we are intending to restore the DB after this deployment
	 *
	 * @return boolean
	 */
	protected function doRestoreDB() {
		return $this->getConfigSetting('RestoreDB') && $this->Pipeline()->PreviousSnapshot();
	}

	/**
	 * Check the status of a resque sub-task
	 *
	 * @param string $status Resque task status
	 * @return boolean True if the task is finished successfully
	 */
	protected function checkResqueStatus($status) {
		switch($status) {
			case "Complete":
				return true;
			case "Failed":
			case "Invalid":
				$this->log("{$this->Title} failed with task status $status");
				$this->markFailed();
				return false;
			case "Queued":
			case "Running":
			default:
				// For running or queued tasks ensure that we have not exceeded
				// a reasonable time-elapsed to consider this job inactive
				if($this->isTimedOut()) {
					$this->log("{$this->Title} took longer than {$this->MaxDuration} seconds to run and has timed out");
					$this->markFailed();
					return false;
				} else {
					// While still running report no error, waiting for resque job to eventually finish
					// some time in the future
					$this->log("{$this->Title} is still in progress");
					return false;
				}
		}
	}
}
