<?php

/**
 * This dispatcher takes care of updating and returning information about this
 * projects git repository
 */
class DeployDispatcher extends Dispatcher {

	const ACTION_DEPLOY = 'deploys';

	/**
	 * @var array
	 */
	private static $allowed_actions = [
		'history',
		'upcoming',
		'currentbuild',
		'show',
		'delete',
		'log',
		'redeploy',
		'createdeployment',
		'start'
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
		self::ACTION_DEPLOY
	];

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
	 * @return \HTMLText|\SS_HTTPResponse
	 */
	public function index(\SS_HTTPRequest $request) {
		return $this->redirect(\Controller::join_links($this->Link(), 'history'), 302);
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function history(\SS_HTTPRequest $request) {
		$data = [];

		$list = $this->environment->DeployHistory('DeployStarted');

		foreach ($list as $deployment) {
			$data[] = $this->formatter->getDeploymentData($deployment);
		}

		return $this->getAPIResponse([
			'list' => $data,
		], 200);
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function upcoming(\SS_HTTPRequest $request) {
		$data = [];
		$list = $this->environment->UpcomingDeployments();
		foreach ($list as $deployment) {
			$data[] = $this->formatter->getDeploymentData($deployment);
		}
		return $this->getAPIResponse([
			'list' => $data,
		], 200);
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function currentbuild(\SS_HTTPRequest $request) {
		$currentBuild = $this->environment->CurrentBuild();
		if (!$currentBuild) {
			return $this->getAPIResponse(['deployment' => []], 200);
		}
		return $this->getAPIResponse(['deployment' => $this->formatter->getDeploymentData($currentBuild)], 200);
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function show(\SS_HTTPRequest $request) {
		$deployment = DNDeployment::get()->byId($request->param('ID'));
		$errorResponse = $this->validateDeployment($deployment);
		if ($errorResponse instanceof \SS_HTTPResponse) {
			return $errorResponse;
		}
		return $this->getAPIResponse(['deployment' => $this->formatter->getDeploymentData($deployment)], 200);
	}

	public function delete(\SS_HTTPRequest $request) {
		if ($request->httpMethod() !== 'POST') {
			return $this->getAPIResponse(['message' => 'Method not allowed, requires POST'], 405);
		}

		$this->checkSecurityToken();

		$deployment = DNDeployment::get()->byId($request->postVar('id'));
		$errorResponse = $this->validateDeployment($deployment);
		if ($errorResponse instanceof \SS_HTTPResponse) {
			return $errorResponse;
		}

		$id = $deployment->ID;
		$deployment->delete();

		return $this->getAPIResponse([
			'id' => $id,
			'message' => 'Deployment has been deleted'
		], 201);
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function log(\SS_HTTPRequest $request) {
		$deployment = DNDeployment::get()->byId($request->param('ID'));
		$errorResponse = $this->validateDeployment($deployment);
		if ($errorResponse instanceof \SS_HTTPResponse) {
			return $errorResponse;
		}
		$log = $deployment->log();
		$content = $log->exists() ? $log->content() : 'Waiting for action to start';
		$lines = explode(PHP_EOL, $content);

		return $this->getAPIResponse([
			'message' => $lines,
			'status' => $deployment->Status,
			'deployment' => $this->formatter->getDeploymentData($deployment),
		], 200);
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function redeploy(\SS_HTTPRequest $request) {
		$currentBuild = $this->environment->CurrentBuild();
		if (!$currentBuild || !$currentBuild->exists()) {
			return $this->redirect(Controller::join_links(
				$this->environment->Link(\EnvironmentOverview::ACTION_OVERVIEW),
				'deployment',
				'new'
			));
		}

		$strategy = $this->environment->Backend()->planDeploy($this->environment, [
			'sha' => $currentBuild->SHA,
			'ref_type' => \GitDispatcher::REF_TYPE_PREVIOUS,
			'branch' => $currentBuild->Branch
		]);
		$deployment = $strategy->createDeployment();

		return $this->redirect($deployment->Link());
	}

	/**
	 * Create deployment. Can't use {@link create()} as it's taken by Object.
	 *
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function createdeployment(\SS_HTTPRequest $request) {
		if ($request->httpMethod() !== 'POST') {
			return $this->getAPIResponse(['message' => 'Method not allowed, requires POST'], 405);
		}

		$this->checkSecurityToken();

		// @todo the strategy should have been saved when there has been a request for an
		// approval or a bypass. This saved state needs to be checked if it's invalidated
		// if another deploy happens before this one
		$isBranchDeploy = (int) $request->postVar('ref_type') === GitDispatcher::REF_TYPE_BRANCH;

		$options = [
			'sha' => $request->postVar('ref'),
			'ref_type' => $request->postVar('ref_type'),
			'branch' => $isBranchDeploy ? $request->postVar('ref_name') : null,
			'title' => $request->postVar('title'),
			'summary' => $request->postVar('summary')
		];

		if ($request->postVar('options')) {
			foreach (explode(',', $request->postVar('options')) as $option) {
				$options[$option] = true;
			}
		}

		$strategy = $this->environment->Backend()->planDeploy($this->environment, $options);

		$approver = Member::get()->byId($request->postVar('approver_id'));
		if ($approver && $approver->exists()) {
			if (!$this->project->allowed(ApprovalsDispatcher::ALLOW_APPROVAL, $approver)) {
				return $this->getAPIResponse(['message' => 'The given approver does not have permissions to approve'], 403);
			}
		}

		$deployment = $strategy->createDeployment();
		if ($approver && $approver->exists()) {
			$deployment->ApproverID = $approver->ID;
			$deployment->write();
		}

		return $this->getAPIResponse([
			'message' => 'Deployment has been created',
			'deployment' => $this->formatter->getDeploymentData($deployment),
		], 201);
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function start(\SS_HTTPRequest $request) {
		if ($request->httpMethod() !== 'POST') {
			return $this->getAPIResponse(['message' => 'Method not allowed, requires POST'], 405);
		}

		$this->checkSecurityToken();

		$deployment = DNDeployment::get()->byId($request->postVar('id'));
		$errorResponse = $this->validateDeployment($deployment);
		if ($errorResponse instanceof \SS_HTTPResponse) {
			return $errorResponse;
		}

		// The deployment cannot be started until it has been approved, or bypassed straight to approved state
		if ($deployment->State != DNDeployment::STATE_APPROVED) {
			return $this->getAPIResponse(['message' => 'This deployment has not been approved. Cannot deploy'], 403);
		}

		// until we have a system that can invalidate currently scheduled deployments due
		// to emergency deploys etc, replan the deployment to check if it's still valid.
		$options = $deployment->getDeploymentStrategy()->getOptions();
		$strategy = $this->environment->Backend()->planDeploy($this->environment, $options);
		$deployment->Strategy = $strategy->toJSON();
		$deployment->write();

		$deployment->getMachine()->apply(DNDeployment::TR_QUEUE);

		$location = \Controller::join_links(Director::absoluteBaseURL(), $this->Link('log'), $deployment->ID);

		$response = $this->getAPIResponse([
			'message' => 'Deployment has been queued',
			'location' => $location,
			'deployment' => $this->formatter->getDeploymentData($deployment),
		], 201);

		$response->addHeader('Location', $location);

		return $response;
	}

	/**
	 * @param string $action
	 * @return string
	 */
	public function Link($action = '') {
		return \Controller::join_links($this->environment->Link(), self::ACTION_DEPLOY, $action);
	}

	/**
	 * @param string $name
	 * @return array
	 */
	public function getModel($name = '') {
		return [];
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

}
