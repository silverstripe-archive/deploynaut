<?php

/**
 * Allows a member with the correct permissions to trigger a deployment
 * for  an approved pipeline
 *
 * Configure using the below code in your deploy.yml
 *
 *
 * <code>
 * Steps:
 *       RequestDeploymentStep:
 *         Class: TriggerDeployStep
 *         MaxDuration: 86400 # Auto time out after a day
 * </code>
 *
 * @property SS_Datetime $Deployed
 *
 * @method Member Responder() Member who has given an approval for this request
 * @property int ResponderID
 *
 * @package deploynaut
 * @subpackage pipeline
 */
class TriggerDeployStep extends LongRunningPipelineStep {

	private static $db = array(
		// if this is deployed set the date it was requested
		'Deployed' => "SS_Datetime"
	);

	private static $has_one = array(
		'Responder' => 'Member'
	);

	public function start() {
		// Just in case this step is being mistakenly restarted
		if(!empty($this->Deployed)) {
			$this->log(_t('TriggerDeployStep.BEENDEPLOYED',
				"{$this->Title} has already been deployed"));
			$this->markFailed();
			return false;
		}

		// check if we have timed out
		if($this->isTimedOut()) {
			$this->log(sprintf(_t('TriggerDeployStep.DEPLOYTIMEOUT',
				'Deployment step is older then %s seconds and has timed out'),
				$this->MaxDuration));
			$this->markFailed();
			return false;
		}

		// Begin or process this step
		switch($this->Status) {
			case 'Started':
				return true;
			case 'Queued':
				return $this->StartDeployment();
			default:
				$this->log(_t('TriggerDeployStep.STARTERROR',
					 "Unable to process {$this->Title} with status of {$this->Status}"));
				$this->markFailed();
				return false;
		}
	}

	/**
	 * Can the current user trigger the deployment for this pipeline?
	 *
	 * @param type $member
	 * @return boolean
	 */
	public function canTriggerDeploy($member = null) {
		return $this->Pipeline()->Environment()->canDeploy($member);
	}

	/**
	 * When a member wishes to deploy this pipeline
	 *
	 * @return boolean True if successful
	 */
	public function deploy() {
		// Check permission
		if(!$this->canTriggerDeploy()) {
			return Security::permissionFailure(
				null,
				_t("TriggerDeployStep.DENYTRIGGERDEPLOY",
				"You do not have permission to deploy this pipeline")
			);
		}

		if($this->Status == 'Queued') {
			$this->start();
		}
		// Trigger deployment
		$this->Deployed = SS_Datetime::now()->Rfc2822();
		$this->log(_t('TriggerDeployStep.BEINGDEPLOYED',
			"{$this->Title} is being deployed"));
		$this->ResponderID = Member::currentUserID();
		$this->finish();
		return true;
	}

	/**
	 * Initiate the deployment process
	 */
	public function StartDeployment() {
		$this->Status = 'Started';
		if(!$this->Started) {
			$this->Started = SS_Datetime::now()->Rfc2822();
		}
		$this->log("Starting {$this->Title}...");
		$this->write();
		return true;
	}

	public function getRunningDescription() {
		// Don't show options if this step has already been confirmed
		if($this->Deployed) {
			return;
		}

		return _t('TriggerDeployStep.RUNNINGDESCRIPTION',
			'Please press the "Deploy" button to continue deployment');
	}

	public function allowedActions() {
		// Don't show options if this step has already been confirmed or can't be confirmed
		if(!$this->canTriggerDeploy()) {
			return parent::allowedActions();
		}

		// Return actions
		return array(
			'deploy' => array(
				'ButtonText' => 'Deploy',
				'ButtonType' => 'btn-success',
				'Link' => $this->Pipeline()->StepLink('deploy'),
				'Title' => 'Trigger the current deployment, allowing it to continue'
			)
		);
	}
}
