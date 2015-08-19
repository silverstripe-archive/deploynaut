<?php

/**
 * Allows a member with the correct permissions to trigger a rollback
 * for an approved pipeline.
 *
 * Configure using the below code in your deploy.yml
 *
 * <code>
 * Steps:
 *   RollbackWindow:
 *     Class: EmergencyRollbackStep
 *     MaxDuration: 3600 # Auto time out after a hour
 * </code>
 *
 * @property SS_Datetime RolledBack
 *
 * @method string Title()
 *
 * @method Member Responder() Member who has given an approval for this request
 * @property int ResponderID
 *
 * @package deploynaut
 * @subpackage pipeline
 */
class EmergencyRollbackStep extends LongRunningPipelineStep {

	/**
	 * @var array
	 */
	private static $db = array(
		// if this has been rolled back set the date it was requested
		'RolledBack' => "SS_Datetime"
	);

	/**
	 * @var array
	 */
	private static $has_one = array(
		'Responder' => 'Member'
	);

	/**
	 * @return bool
	 */
	public function start() {
		// Just in case this step is being mistakenly restarted
		if(!empty($this->RolledBack)) {
			$this->log(_t('EmergencyRollbackStep.BEENROLLEDBACK',
				"{$this->Title} has already been rolled back"));
			$this->markFailed();
			return false;
		}

		// check if we have timed out
		if($this->isTimedOut()) {
			$this->log(sprintf(_t('EmergencyRollbackStep.ROLLBACKTIMEOUT',
				"{$this->Title} is older than %s seconds and has timed out"),
				$this->MaxDuration));
			$this->finish();
			return true;
		}

		// Begin or process this step
		switch($this->Status) {
			case 'Started':
				return true;
			case 'Queued':
				return $this->beginRollbackWindow();
			default:
				$this->log(_t('EmergencyRollbackStep.STARTERROR',
					"Unable to process {$this->Title} with status of {$this->Status}"));
				$this->markFailed();
				return false;
		}
	}

	/**
	 * The user can do an emergency rollback if he could have deployed the code, or if he can abort pipelines.
	 *
	 * @param Member|null $member
	 * @return boolean
	 */
	public function canTriggerRollback($member = null) {
		return $this->Pipeline()->Environment()->canDeploy($member) || $this->Pipeline()->canAbort($member);
	}

	/**
	 * When a member wishes to rollback this pipeline
	 *
	 * @return boolean True if successful
	 */
	public function rollback() {
		// Check permission
		if(!$this->canTriggerRollback()) {
			return Security::permissionFailure(
				null,
				_t("EmergencyRollbackStep.DENYROLLBACKED",
				"You do not have permission to rollback this pipeline")
			);
		}

		if($this->Status == 'Queued') {
			$this->start();
		}

		// Write down some metadata.
		$this->RolledBack = SS_Datetime::now()->Rfc2822();
		$this->log(_t('EmergencyRollbackStep.BEINGROLLEDBACK', "{$this->Title} is being rolled back"));
		$this->ResponderID = Member::currentUserID();
		$this->write();

		// Rollback itself is handled by the Pipeline object. This step will be marked as failed.
		if($this->Pipeline()->isRunning()) {
			$this->Pipeline()->markFailed();
			return true;
		} else {
			return false;
		}
	}

	/**
	 * Dismiss the rollback window
	 */
	public function dismiss() {
		// Check permission
		if(!$this->canTriggerRollback()) {
			return Security::permissionFailure(
				null,
				_t("EmergencyRollbackStep.DENYROLLBACKED",
				"You do not have permission to rollback this pipeline")
			);
		}

		$this->log("Dismissing rollback window.");
		$this->finish();
		return true;
	}

	/**
	 * Initiate the a rollback window
	 */
	public function beginRollbackWindow() {
		$this->Status = 'Started';
		if(!$this->Started) {
			$this->Started = SS_Datetime::now()->Rfc2822();
		}
		$this->log(_t('EmergencyRollbackStep.BEGINROLLBACKWINDOW',
			"{$this->Title} is beginning a rollback window..."));
		$this->write();
		// Message author that the deployment is complete
		$this->Pipeline()->sendMessage(Pipeline::ALERT_SUCCESS);
		return true;
	}

	public function getRunningDescription() {
		// Don't show options if this step has already been confirmed
		if($this->RolledBack) {
			return;
		}

		return _t('EmergencyRollbackStep.RUNNINGDESCRIPTION',
			'You may now roll back to the previous version, if needed.');
	}

	public function allowedActions() {
		// Don't show options if this step has already been confirmed or can't be confirmed
		if(!$this->canTriggerRollback()) {
			return parent::allowedActions();
		}

		// Return actions
		return array(
			'rollback' => array(
				'ButtonText' => _t('EmergencyRollbackStep.ROLLBACKBUTTON', 'Rollback'),
				'ButtonType' => 'btn-success',
				'Link' => $this->Pipeline()->StepLink('rollback'),
				'Title' => _t('EmergencyRollbackStep.ROLLBACKTHEDEPLOYMENTTITLE', 'Rollback the deployment')
			),
			'dismiss' => array(
				'ButtonText' => _t('EmergencyRollbackStep.DISMISS', 'Dismiss'),
				'ButtonType' => 'btn-info',
				'Link' => $this->Pipeline()->StepLink('dismiss'),
				'Title' => _t('EmergencyRollbackStep.ROLLBACKTHEDEPLOYMENTTITLE', 'Dismiss this option')
			)
		);
	}
}
