<?php

class ApprovalsDispatcher extends Dispatcher {

	const ACTION_APPROVALS = 'approvals';

	const ALLOW_APPROVAL = 'ALLOW_APPROVAL';

	const ALLOW_APPROVAL_BYPASS = 'ALLOW_APPROVAL_BYPASS';

	/**
	 * @var array
	 */
	private static $allowed_actions = [
		'submit',
		'cancel',
		'approve',
		'reject'
	];

	private static $dependencies = [
		'formatter' => '%$DeploynautAPIFormatter'
	];

	/**
	 * @var \DNProject
	 */
	protected $project = null;

	/**
	 * @var \DNEnvironment
	 */
	protected $environment = null;

	/**
	 * @param \DNEnvironment $environment
	 * @param \Member|null $member
	 * @return bool
	 */
	public static function can_approve(\DNEnvironment $environment, \Member $member = null) {
		if ($member === null) {
			$member = \Member::currentUser();
		}
		return $environment->Project()->allowed(self::ALLOW_APPROVAL, $member);
	}

	/**
	 * @param \DNEnvironment $environment
	 * @param \Member|null $member
	 * @return bool
	 */
	public static function can_bypass_approval(\DNEnvironment $environment, \Member $member = null) {
		if ($member === null) {
			$member = \Member::currentUser();
		}
		// special case for non-Production environments: users who can deploy are able to bypass approval.
		if ($environment->Usage !== \DNEnvironment::PRODUCTION && $environment->canDeploy($member)) {
			return true;
		}
		return $environment->Project()->allowed(self::ALLOW_APPROVAL_BYPASS, $member);
	}

	public function init() {
		parent::init();

		$this->project = $this->getCurrentProject();
		if (!$this->project) {
			return $this->project404Response();
		}

		// Performs canView permission check by limiting visible projects
		$this->environment = $this->getCurrentEnvironment($this->project);
		if (!$this->environment) {
			return $this->environment404Response();
		}
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function submit(\SS_HTTPRequest $request) {
		if ($request->httpMethod() !== 'POST') {
			return $this->getAPIResponse(['message' => 'Method not allowed, requires POST'], 405);
		}

		$this->checkSecurityToken();

		$deployment = \DNDeployment::get()->byId($request->postVar('id'));
		$errorResponse = $this->validateDeployment($deployment);
		if ($errorResponse instanceof \SS_HTTPResponse) {
			return $errorResponse;
		}

		$approver = \Member::get()->byId($request->postVar('approver_id'));
		if ($approver && $approver->exists()) {
			if (!self::can_approve($this->environment, $approver)) {
				return $this->getAPIResponse(['message' => 'The given approver does not have permissions to approve'], 403);
			}
			$deployment->ApproverID = $approver->ID;
		}

		// title and summary may have changed, ensure they are saved
		if ($request->postVar('title')) {
			$deployment->Title = $request->postVar('title');
		}
		if ($request->postVar('summary')) {
			$deployment->Summary = $request->postVar('summary');
		}

		try {
			$deployment->getMachine()->apply(\DNDeployment::TR_SUBMIT);
		} catch (\Exception $e) {
			return $this->getAPIResponse([
				'message' => $e->getMessage()
			], 400);
		}

		return $this->getAPIResponse([
			'message' => 'Deployment request has been submitted',
			'deployment' => $this->formatter->getDeploymentData($deployment)
		], 200);
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function cancel(\SS_HTTPRequest $request) {
		if ($request->httpMethod() !== 'POST') {
			return $this->getAPIResponse(['message' => 'Method not allowed, requires POST'], 405);
		}

		$this->checkSecurityToken();

		$deployment = \DNDeployment::get()->byId($request->postVar('id'));
		$errorResponse = $this->validateDeployment($deployment);
		if ($errorResponse instanceof \SS_HTTPResponse) {
			return $errorResponse;
		}

		// if the person cancelling is not the one who created the deployment, update the deployer
		if (\Member::currentUserID() !== $deployment->DeployerID) {
			$deployment->DeployerID = \Member::currentUserID();
		}

		try {
			$deployment->getMachine()->apply(\DNDeployment::TR_NEW);
		} catch (\Exception $e) {
			return $this->getAPIResponse([
				'message' => $e->getMessage()
			], 400);
		}

		return $this->getAPIResponse([
			'message' => 'Deployment request has been cancelled',
			'deployment' => $this->formatter->getDeploymentData($deployment)
		], 200);
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function approve(\SS_HTTPRequest $request) {
		if ($request->httpMethod() !== 'POST') {
			return $this->getAPIResponse(['message' => 'Method not allowed, requires POST'], 405);
		}

		$this->checkSecurityToken();

		$deployment = \DNDeployment::get()->byId($request->postVar('id'));
		$errorResponse = $this->validateDeployment($deployment);
		if ($errorResponse instanceof \SS_HTTPResponse) {
			return $errorResponse;
		}

		$canBypass = self::can_bypass_approval($this->environment);
		$canApprove = self::can_approve($this->environment);

		// ensure we have either bypass or approval permission of the logged in user
		if (!$canBypass || !$canBypass) {
			return $this->getAPIResponse(['message' => 'You are not authorised to approve or bypass this deployment'], 403);
		}

		// check for specific permission depending on the current state of the deployment:
		// submitted => approved requires approval permissions
		// new => approved requires bypass permissions.
		if ($deployment->State === \DNDeployment::STATE_SUBMITTED && !$canApprove) {
			return $this->getAPIResponse(['message' => 'You are not authorised to approve this deployment'], 403);
		}
		if ($deployment->State === \DNDeployment::STATE_NEW && !$canBypass) {
			return $this->getAPIResponse(['message' => 'You are not authorised to bypass approval of this deployment'], 403);
		}

		if ($deployment->State === \DNDeployment::STATE_NEW) {
			// Bypassing approval: Ensure that approver is not set. This may happen when someone has requested approval,
			// cancelled approval, then bypassed.
			$deployment->ApproverID = 0;
		} else {
			// if the current user is not the person who was selected for approval on submit, but they got
			// here because they still have permission, then change the approver to the current user
			if (\Member::currentUserID() !== $deployment->ApproverID) {
				$deployment->ApproverID = \Member::currentUserID();
			}
		}

		// title and summary may have changed, ensure they are saved
		if ($request->postVar('title')) {
			$deployment->Title = $request->postVar('title');
		}
		if ($request->postVar('summary')) {
			$deployment->Summary = $request->postVar('summary');
		}

		try {
			$deployment->getMachine()->apply(\DNDeployment::TR_APPROVE);
		} catch (\Exception $e) {
			return $this->getAPIResponse([
				'message' => $e->getMessage()
			], 400);
		}

		return $this->getAPIResponse([
			'message' => 'Deployment request has been approved',
			'deployment' => $this->formatter->getDeploymentData($deployment)
		], 200);
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function reject(\SS_HTTPRequest $request) {
		if ($request->httpMethod() !== 'POST') {
			return $this->getAPIResponse(['message' => 'Method not allowed, requires POST'], 405);
		}

		$this->checkSecurityToken();

		$deployment = \DNDeployment::get()->byId($request->postVar('id'));
		$errorResponse = $this->validateDeployment($deployment);
		if ($errorResponse instanceof \SS_HTTPResponse) {
			return $errorResponse;
		}

		// reject permissions are the same as can approve
		if (!self::can_approve($this->environment)) {
			return $this->getAPIResponse(['message' => 'You are not authorised to reject this deployment'], 403);
		}

		// if the current user is not the person who was selected for approval on submit, but they got
		// here because they still have permission, then change the approver to the current user
		if (\Member::currentUserID() !== $deployment->ApproverID) {
			$deployment->ApproverID = \Member::currentUserID();
		}

		if ($request->postVar('rejected_reason')) {
			$deployment->RejectedReason = $request->postVar('rejected_reason');
		}

		try {
			$deployment->getMachine()->apply(\DNDeployment::TR_REJECT);
		} catch (\Exception $e) {
			return $this->getAPIResponse([
				'message' => $e->getMessage()
			], 400);
		}

		return $this->getAPIResponse([
			'message' => 'Deployment request has been rejected',
			'deployment' => $this->formatter->getDeploymentData($deployment)
		], 200);
	}

	/**
	 * Check if a DNDeployment exists and do permission checks on it. If there is something wrong it will return
	 * an APIResponse with the error, otherwise null.
	 *
	 * @param \DNDeployment $deployment
	 *
	 * @return null|SS_HTTPResponse
	 */
	protected function validateDeployment($deployment) {
		if (!$deployment || !$deployment->exists()) {
			return $this->getAPIResponse(['message' => 'This deployment does not exist'], 404);
		}
		if ($deployment->EnvironmentID != $this->environment->ID) {
			return $this->getAPIResponse(['message' => 'This deployment does not belong to the environment'], 403);
		}
		if (!$deployment->canView()) {
			return $this->getAPIResponse(['message' => 'You are not authorised to view this deployment'], 403);
		}
		return null;
	}

	/**
	 * @param string $name
	 * @return array
	 */
	public function getModel($name = '') {
		return [];
	}

	/**
	 * @param string $action
	 * @return string
	 */
	public function Link($action = '') {
		return \Controller::join_links($this->environment->Link(), self::ACTION_APPROVALS, $action);
	}

}
