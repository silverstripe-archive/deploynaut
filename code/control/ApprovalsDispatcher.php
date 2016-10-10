<?php

class ApprovalsDispatcher extends Dispatcher {

	const ACTION_APPROVALS = 'approvals';

	const ALLOW_APPROVAL = 'ALLOW_APPROVAL';

	const ALLOW_APPROVAL_BYPASS = 'ALLOW_APPROVAL_BYPASS';

	/**
	 * @var array
	 */
	private static $allowed_actions = [
		'approvers',
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
	 * @var array
	 */
	private static $action_types = [
		self::ACTION_APPROVALS
	];

	/**
	 * This is a per request cache of $this->project()->listMembers()
	 * @var null|array
	 */
	private static $_cache_project_members = null;

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
	public function approvers(SS_HTTPRequest $request) {
		$list = [];

		if (self::$_cache_project_members === null) {
			self::$_cache_project_members = $this->project->listMembers();
		}

		foreach (self::$_cache_project_members as $data) {
			if ($this->project->allowed(self::ALLOW_APPROVAL, Member::get()->byId($data['MemberID']))) {
				$list[] = [
					'id' => $data['MemberID'],
					'email' => $data['Email'],
					'role' => $data['RoleTitle'],
					'name' => $data['FullName']
				];
			}
		}

		return $this->getAPIResponse([
			'approvers' => $list
		], 200);
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function submit(SS_HTTPRequest $request) {
		if ($request->httpMethod() !== 'POST') {
			return $this->getAPIResponse(['message' => 'Method not allowed, requires POST'], 405);
		}

		$deployment = DNDeployment::get()->byId($request->postVar('id'));
		$errorResponse = $this->validateDeployment($deployment);
		if ($errorResponse instanceof \SS_HTTPResponse) {
			return $errorResponse;
		}

		$approver = Member::get()->byId($request->postVar('approver_id'));
		if ($approver && $approver->exists()) {
			if (!$this->project->allowed(ApprovalsDispatcher::ALLOW_APPROVAL, $approver)) {
				return $this->getAPIResponse(['message' => 'The given approver does not have permissions to approve'], 403);
			}

			$deployment->ApproverID = $approver->ID;
			$deployment->write();
		}

		try {
			$deployment->getMachine()->apply(DNDeployment::TR_SUBMIT);
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
	public function cancel(SS_HTTPRequest $request) {
		if ($request->httpMethod() !== 'POST') {
			return $this->getAPIResponse(['message' => 'Method not allowed, requires POST'], 405);
		}

		$deployment = DNDeployment::get()->byId($request->postVar('id'));
		$errorResponse = $this->validateDeployment($deployment);
		if ($errorResponse instanceof \SS_HTTPResponse) {
			return $errorResponse;
		}

		// if the person cancelling is not the one who created the deployment, update the deployer
		if (Member::currentUserID() !== $deployment->DeployerID) {
			$deployment->DeployerID = Member::currentUserID();
			$deployment->write();
		}

		try {
			$deployment->getMachine()->apply(DNDeployment::TR_NEW);
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
	public function approve(SS_HTTPRequest $request) {
		if ($request->httpMethod() !== 'POST') {
			return $this->getAPIResponse(['message' => 'Method not allowed, requires POST'], 405);
		}

		$deployment = DNDeployment::get()->byId($request->postVar('id'));
		$errorResponse = $this->validateDeployment($deployment);
		if ($errorResponse instanceof \SS_HTTPResponse) {
			return $errorResponse;
		}

		// ensure we have either bypass or approval permission of the logged in user
		if (
			!$this->project->allowed(self::ALLOW_APPROVAL_BYPASS, Member::currentUser())
			|| !$this->project->allowed(self::ALLOW_APPROVAL, Member::currentUser())
		) {
			return $this->getAPIResponse(['message' => 'You are not authorised to approve or bypass this deployment'], 403);
		}

		// check for specific permission depending on the current state of the deployment:
		// submitted => approved requires approval permissions
		// new => approved requires bypass permissions.
		if (
			$deployment->State === DNDeployment::STATE_SUBMITTED
			&& !$this->project->allowed(self::ALLOW_APPROVAL, Member::currentUser())
		) {
			return $this->getAPIResponse(['message' => 'You are not authorised to approve this deployment'], 403);
		}
		if (
			$deployment->State === DNDeployment::STATE_NEW
			&& !$this->project->allowed(self::ALLOW_APPROVAL_BYPASS, Member::currentUser())
		) {
			return $this->getAPIResponse(['message' => 'You are not authorised to bypass approval of this deployment'], 403);
		}

		// if the current user is not the person who was selected for approval on submit, but they got
		// here because they still have permission, then change the approver to the current user
		if (Member::currentUserID() !== $deployment->ApproverID) {
			$deployment->ApproverID = Member::currentUserID();
			$deployment->write();
		}

		try {
			$deployment->getMachine()->apply(DNDeployment::TR_APPROVE);
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
	public function reject(SS_HTTPRequest $request) {
		if ($request->httpMethod() !== 'POST') {
			return $this->getAPIResponse(['message' => 'Method not allowed, requires POST'], 405);
		}

		$deployment = DNDeployment::get()->byId($request->postVar('id'));
		$errorResponse = $this->validateDeployment($deployment);
		if ($errorResponse instanceof \SS_HTTPResponse) {
			return $errorResponse;
		}
		// reject permissions are the same as can approve
		if (!$this->project->allowed(self::ALLOW_APPROVAL, Member::currentUser())) {
			return $this->getAPIResponse(['message' => 'You are not authorised to reject this deployment'], 403);
		}

		// if the current user is not the person who was selected for approval on submit, but they got
		// here because they still have permission, then change the approver to the current user
		if (Member::currentUserID() !== $deployment->ApproverID) {
			$deployment->ApproverID = Member::currentUserID();
			$deployment->write();
		}

		try {
			$deployment->getMachine()->apply(DNDeployment::TR_REJECT);
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
	protected function validateDeployment(\DNDeployment $deployment) {
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
