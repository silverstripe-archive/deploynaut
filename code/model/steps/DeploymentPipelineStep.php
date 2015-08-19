<?php

/**
 * Class DeploymentPipelineTest
 * This class performs the actual deployment after the smoke test has passed
 *
 * Configure using the below code in your deploy.yml
 * <code>
 * Steps:
 *   FinalDeployment:
 *     Class: DeploymentPipelineStep
 *     MaxDuration: 3600 # optionally timeout after 1 hour
 * </code>
 *
 * {@see DNRoot::doDeploy()} for non-pipeline equivalent
 *
 * @package deploynaut
 * @subpackage pipeline
 */
class DeploymentPipelineStep extends LongRunningPipelineStep {

	private static $db = array(
		'Doing' => "Enum('Deployment,Snapshot,Queued', 'Queued')"
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
						return $this->continueDeploy();
					case 'Snapshot':
						return $this->continueSnapshot();
					default:
						$this->log("Unable to process {$this->Title} with subtask of {$this->Doing}");
						$this->markFailed();
						return false;
				}
			case 'Queued':
				return $this->createSnapshot();
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
	protected function startDeploy() {
		$this->Status = 'Started';
		$this->Doing = 'Deployment';
		$this->log("{$this->Title} starting deployment");

		// Check environment and SHA
		$pipeline = $this->Pipeline();
		$environment = $pipeline->Environment();
		if(empty($environment) || !$environment->exists()) {
			$this->log("No available environment for {$this->Title}");
			$this->markFailed();
			return false;
		}

		if(empty($pipeline->SHA)) {
			$this->log("No available SHA for {$this->Title}");
			$this->markFailed();
			return false;
		}

		// Skip deployment for dry run
		if($this->Pipeline()->DryRun) {
			$this->log("[Skipped] Create DNDeployment for SHA " . $pipeline->SHA);
			$this->write();
			return true;
		}

		// Initialise deployment
		$deployment = DNDeployment::create();
		$deployment->EnvironmentID = $environment->ID;
		$deployment->SHA = $pipeline->SHA;
		$previousStep = $pipeline->findPreviousStep();
		$deployment->DeployerID = ($previousStep && $previousStep->ResponderID)
			? $previousStep->ResponderID
			: $pipeline->AuthorID;
		$deployment->write();
		$deployment->start();
		$pipeline->CurrentDeploymentID = $deployment->ID;
		$pipeline->write();
		$this->write();

		return true;
	}

	/**
	 * Create a snapshot of the db and store the ID on the Pipline
	 * @return bool True if success
	 */
	protected function createSnapshot() {
		// Mark self as creating a snapshot
		$this->Status = 'Started';
		$this->Doing = 'Snapshot';
		$this->log("{$this->Title} creating snapshot of database");
		$this->write();

		// Skip deployment for dry run
		if($this->Pipeline()->DryRun) {
			$this->log("[Skipped] Create DNDataTransfer backup");
			return true;
		}

		// Skip snapshot for environments with no build
		if(!$this->Pipeline()->Environment()->CurrentBuild()) {
			$this->log('[Skipped] No current build, skipping snapshot');
			return true;
		}

		// create a snapshot
		$pipeline = $this->Pipeline();
		$job = DNDataTransfer::create();
		$job->EnvironmentID = $pipeline->EnvironmentID;
		$job->Direction = 'get';
		$job->Mode = 'db';
		$job->DataArchiveID = null;
		$job->AuthorID = $pipeline->AuthorID;
		$job->write();
		$job->start();

		$pipeline->PreviousSnapshotID = $job->ID;
		$pipeline->write();

		return true;
	}

	/**
	 * Check status of current snapshot
	 */
	protected function continueSnapshot() {
		$this->log("Checking status of {$this->Title}...");

		// Skip snapshot for dry run
		if($this->Pipeline()->DryRun) {
			$this->log("[Skipped] Checking progress of snapshot backup");
			return $this->startDeploy();
		}

		// Skip snapshot for environments with no build
		if(!$this->Pipeline()->Environment()->CurrentBuild()) {
			return $this->startDeploy();
		}

		// Get related snapshot
		$snapshot = $this->Pipeline()->PreviousSnapshot();
		if(empty($snapshot) || !$snapshot->exists()) {
			$this->log("Missing snapshot for in-progress {$this->Title}");
			$this->markFailed();
			return false;
		}

		// Check finished state
		$status = $snapshot->ResqueStatus();
		if($this->checkResqueStatus($status)) {
			// After snapshot is done, switch to doing deployment
			return $this->startDeploy();
		}
	}

	/**
	 * Check status of deployment and finish task if complete, or fail if timedout
	 *
	 * @return boolean
	 */
	protected function continueDeploy() {
		$this->log("Checking status of {$this->Title}...");

		// Skip deployment for dry run
		if($this->Pipeline()->DryRun) {
			$this->log("[Skipped] Checking progress of deployment");
			$this->finish();
			return !$this->isFailed();
		}

		// Get related deployment
		$deployment = $this->Pipeline()->CurrentDeployment();
		if(empty($deployment) || !$deployment->exists()) {
			$this->log("Missing deployment for in-progress {$this->Title}");
			$this->markFailed();
			return false;
		}

		// Check finished state
		$status = $deployment->ResqueStatus();
		if($this->checkResqueStatus($status)) {
			$this->finish();
		}
		return !$this->isFailed();
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
