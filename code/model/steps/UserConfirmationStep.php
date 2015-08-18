<?php

/**
 * Pauses progression of a deployment while external authorisation is requested.
 * This is performed via the default messaging service specified.
 *
 * Configure using the below code in your deploy.yml
 *
 * MessagingArguments is an arbitrary array of arguments which is understood by
 * the service specified as the ConfirmationMessagingService for this project.
 * See deploynaut/_config/messaging.yml for the default service configuration.
 * See deploynaut/_config/pipeline.yml for the default step configuration
 *
 * <code>
 * Steps:
 *   RequestConfirmationStep:
 *     Class: UserConfirmationStep
 *     MaxDuration: 604800 # Auto time out after a week
 *     Recipients:
 *       - 021971373
 *       - mattpeel@silverstripe.com
 *     # Time delay between each of the above recipients being sent out
 *     RecipientsDelay: 4000
 *     Permissions:
 *       # Permissions required to allow deployment. Ensure that the recipients above are assigned this
 *       - APPROVE_DEPLOYMENT
 *     Messages:
 *       # Messages sent to all users (including <requester>)
 *       Reject: 'Deployment for <project>/<environment> has been rejected'
 *       Approve: 'Deployment for <project>/<environment> has been approved'
 *       TimeOut: 'Deployment approval for <project>/<environment> has timed out due to no response'
 *       # Messages only sent to requester
 *       Request-Requester: 'You requested approval for deployment of <project>/<environment>. Cancel? <abortlink>'
 *       # Messages only sent to specified recipients
 *       Request-Recipient: 'Deployment for <project>/<environment> requested by <requester>. Approve? <approvelink>'
 *     Subjects:
 *       # Subject line for all users
 *       Reject: 'Deployment for <project>/<environment>: Rejected'
 *       Approve: 'Deployment for <project>/<environment>: Approved'
 *       TimeOut: 'Deployment for <project>/<environment>: Timeout'
 *       Request: 'Deployment for <project>/<environment>: Requested'
 *     ServiceArguments:
 *       # Additional arguments that make sense to the ConfirmationMessagingService
 *       from: admin@silverstripe.com
 *       reply-to: noreply@silverstripe.com
 * </code>
 *
 * @method Member Responder() Member who has given an approval for this request
 * @property string $Approval
 * @property int $NotifiedGroup
 * @package deploynaut
 * @subpackage pipeline
 */
class UserConfirmationStep extends LongRunningPipelineStep {

	/**
	 * Messages
	 */
	const ALERT_APPROVE = 'Approve';
	const ALERT_TIMEOUT = 'TimeOut';
	const ALERT_REQUEST = 'Request';
	const ALERT_REJECT = 'Reject';

	/**
	 * Message roles
	 */
	const ROLE_REQUESTER = 'Requester';
	const ROLE_RECIPIENT = 'Recipient';

	private static $db = array(
		// A finished step is approved and a failed step is rejected.
		// Aborted confirmation is left as None
		'Approval' => "Enum('Approved,Rejected,None', 'None')",
		// If RecipientsDelay is specified, this value records the index of the most recently notified
		// group of users. This will be incremented once another level of fallback has been notified.
		// E.g. once primary admin has been notified, the secondary admin can be notified, and this
		// is incremented
		'NotifiedGroup' => 'Int'
	);

	private static $defaults = array(
		'Approval' => 'None',
		'NotifiedGroup' => 0
	);

	private static $has_one = array(
		'Responder' => 'Member'
	);

	/**
	 * This step depends on a configured messaging service
	 *
	 * @config
	 * @var array
	 */
	private static $dependencies = array(
		'MessagingService' => '%$ConfirmationMessagingService'
	);

	/**
	 * Currently assigned messaging service
	 *
	 * @var ConfirmationMessagingService
	 */
	private $messagingService = null;

	/**
	 * Assign a messaging service for this step
	 *
	 * @param ConfirmationMessagingService $service
	 */
	public function setMessagingService(ConfirmationMessagingService $service) {
		$this->messagingService = $service;
	}

	/**
	 * Get the currently configured messaging service
	 *
	 * @return ConfirmationMessagingService
	 */
	public function getMessagingService() {
		return $this->messagingService;
	}

	/**
	 * Determine if the confirmation has been responded to (ether with acceptance, rejection, or cancelled)
	 *
	 * @return boolean
	 */
	public function hasResponse() {
		return $this->Approval !== 'None';
	}

	public function start() {
		parent::start();

		// Just in case this step is being mistakenly restarted
		if($this->hasResponse()) {
			$this->log("{$this->Title} has already been processed with a response of {$this->Approval}");
			$this->markFailed();
			return false;
		}

		// Begin or process this step
		switch($this->Status) {
			case 'Started':
				return $this->checkStatus();
			case 'Queued':
				return $this->startApproval();
			default:
				$this->log("Unable to process {$this->Title} with status of {$this->Status}");
				$this->markFailed();
				return false;
		}
	}

	/**
	 * Can the current user approve this pipeline?
	 *
	 * @param Member $member
	 * @return boolean
	 */
	public function canApprove($member = null) {
		return $this->Pipeline()->Environment()->canApprove($member);
	}

	/**
	 * When the recipient wishes to approve this request
	 *
	 * @return boolean True if successful
	 */
	public function approve() {
		// Check permission
		if(!$this->canApprove()) {
			return Security::permissionFailure(
				null,
				_t("UserConfirmationStep.DENYAPPROVE", "You do not have permission to approve this deployment")
			);
		}

		// Skip subsequent approvals if already approved / rejected
		if($this->hasResponse()) return;

		// Approve
		$this->Approval = 'Approved';
		$this->log("{$this->Title} has been approved");
		$this->ResponderID = Member::currentUserID();
		$this->finish();
		$this->sendMessage(self::ALERT_APPROVE);
		return true;
	}

	/**
	 * When the recipient wishes to reject this request
	 *
	 * @return boolean True if successful
	 */
	public function reject() {
		// Check permission
		if(!$this->canApprove()) {
			return Security::permissionFailure(
				null,
				_t("UserConfirmationStep.DENYREJECT", "You do not have permission to reject this deployment")
			);
		}

		// Skip subsequent approvals if already approved / rejected
		if($this->hasResponse()) return;

		// Reject
		$this->Approval = 'Rejected';
		$this->log("{$this->Title} has been rejected");
		$this->ResponderID = Member::currentUserID();
		$this->markFailed(false);
		$this->sendMessage(self::ALERT_REJECT);
		return true;
	}

	/**
	 * Report the status of the current request queue and makes sure it hasn't overrun it's time allowed
	 *
	 * @return boolean True if not failed
	 */
	protected function checkStatus() {
		// For running or queued tasks ensure that we have not exceeded
		// a reasonable time-elapsed to consider this job inactive
		if($this->isTimedOut()) {
			$days = round($this->MaxDuration / (24.0 * 3600.0), 1);
			$this->log("{$this->Title} took longer than {$this->MaxDuration} seconds ($days days) to be approved and has timed out");
			$this->markFailed();
			$this->sendMessage(self::ALERT_TIMEOUT);
			return false;
		}

		// If operating on a delayed notification schedule, determine if there are further groups who should be notified
		if($delay = $this->getConfigSetting('RecipientsDelay')) {
			// Check group that should have been notified by now
			$age = $this->getAge();
			$escallateGroup = intval($age / $delay);
			$recipients = $this->getConfigSetting('Recipients');
			$lastGroup = count($recipients) - 1;
			// If we can notify the next group, do so
			// We only escallate one group at a time to ensure correct order is followed
			if($this->NotifiedGroup < $lastGroup && $this->NotifiedGroup < $escallateGroup) {
				$this->NotifiedGroup++;
				$groupDescription = is_array($recipients[$this->NotifiedGroup])
					? implode(',', $recipients[$this->NotifiedGroup])
					: $recipients[$this->NotifiedGroup];
				$this->log("Escalating approval request to group {$this->NotifiedGroup}: '$groupDescription'");
				// Send to selected group
				$this->sendMessage(self::ALERT_REQUEST, $this->NotifiedGroup);
				$this->write();
				return true;
			}
		}


		// While still running report no error, waiting for resque job to eventually finish.
		// Since this could potentially fill the log with hundreds of thousands of messages,
		// if it takes a few days to get a response, don't write anything.
		return true;
	}

	/**
	 * Initiate the approval process
	 */
	public function startApproval() {
		$this->Status = 'Started';
		$this->log("Starting {$this->Title}...");
		// Determine if we should use delayed notification
		$recipientGroup = 'all';
		if($this->getConfigSetting('RecipientsDelay')) {
			$this->NotifiedGroup = $recipientGroup = 0;
		}
		// Send to selected group
		$this->sendMessage(self::ALERT_REQUEST, $recipientGroup);
		$this->write();
		return true;
	}

	/**
	 * Finds a message template for a given role and message
	 *
	 * @param string $role Role name for role-customised messages. Usually 'Requester' or 'Recipient'
	 * @param string $messageID Message ID
	 * @return array Resulting array(subject, message)
	 */
	protected function generateMessageTemplate($role, $messageID) {
		$subject = $this->getConfigSetting('Subjects', "$messageID-$role")
				?: $this->getConfigSetting('Subjects', $messageID);
		$message = $this->getConfigSetting('Messages', "$messageID-$role")
				?: $this->getConfigSetting('Messages', $messageID);
		$substitutions = $this->getReplacements();
		return $this
			->Pipeline()
			->injectMessageReplacements($message, $subject, $substitutions);
	}

	/**
	 * Retrieve message replacements
	 *
	 * @return array
	 */
	public function getReplacements() {
		// Get member who began this request
		return array_merge(
			$this->Pipeline()->getReplacements(),
			array(
				// Note that this actually displays the link to the interface to approve,
				// not the direct link to the approve action
				'<approvelink>' => Director::absoluteURL($this->Pipeline()->Environment()->Link())
			)
		);
	}

	/**
	 * Sends a message to a specified recipient(s)
	 *
	 * @param string $messageID Message ID. One of 'Reject', 'Approve', 'TimeOut' or 'Request'
	 * @param mixed $recipientGroup Either a numeric index of the next recipient to send to, or "all" for all
	 * This is used for delayed notification so that failover recipients can be notified.
	 * @return boolean|null True if successful
	 */
	protected function sendMessage($messageID, $recipientGroup = 'all') {
		// Add additionally configured arguments
		$arguments = $this->getConfigSetting('ServiceArguments') ?: array();

		// Get member who began this request
		$author = $this->Pipeline()->Author();

		// Send message to requester
		if($recipientGroup === 'all' || $recipientGroup === 0) {
			list($subject, $message) = $this->generateMessageTemplate(self::ROLE_REQUESTER, $messageID);
			if($subject && $message) {
				$this->log("{$this->Title} sending $messageID message to {$author->Email}");
				$extra = array('subject' => $subject);
				$this->messagingService->sendMessage($this, $message, $author, array_merge($arguments, $extra));
			}
		}

		// Filter recipients based on group
		$recipients = $this->getConfigSetting('Recipients');
		if(is_array($recipients) && $recipientGroup !== 'all') {
			$recipients = isset($recipients[$recipientGroup])
				? $recipients[$recipientGroup]
				: null;
		}
		if(empty($recipients)) {
			$this->log("Skipping sending message to empty recipients");
			return;
		}

		// Send to recipients
		list($subject, $message) = $this->generateMessageTemplate(self::ROLE_RECIPIENT, $messageID);
		if($subject && $message && $recipients) {
			$recipientsStr = is_array($recipients) ? implode(',', $recipients) : $recipients;
			$this->log("{$this->Title} sending $messageID message to $recipientsStr");
			$extra = array('subject' => $subject);
			$this->messagingService->sendMessage($this, $message, $recipients, array_merge($arguments, $extra));
		}
	}

	public function getRunningDescription() {

		// Don't show options if this step has already been confirmed
		if($this->hasResponse() || !$this->isRunning()) return;

		return 'This deployment is currently awaiting approval before it can complete.';
	}

	public function allowedActions() {
		// Don't show options if this step has already been confirmed or can't be confirmed
		if($this->hasResponse() || !$this->isRunning() || !$this->canApprove()) {
			return parent::allowedActions();
		}

		// Return actions
		return array(
			'approve' => array(
				'ButtonText' => 'Approve',
				'ButtonType' => 'btn-success',
				'Link' => $this->Pipeline()->StepLink('approve'),
				'Title' => 'Approves the current deployment, allowing it to continue'
			),
			'reject' => array(
				'ButtonText' => 'Reject',
				'ButtonType' => 'btn-danger',
				'Link' => $this->Pipeline()->StepLink('reject'),
				'Title' => 'Deny the request to release this deployment'
			)
		);
	}

}
