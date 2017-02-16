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
		'show',
		'delete',
		'log',
		'redeploy',
		'summary',
		'createdeployment',
		'start',
		'abort'
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
	public static function can_abort_deployment(\DNEnvironment $environment, \Member $member = null) {
		if ($member === null) {
			$member = \Member::currentUser();
		}
		return \Permission::checkMember($member, 'ADMIN');
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

		$fromTimestamp = $request->requestVar('from');
		if ($fromTimestamp) {
			$from = SS_Datetime::create();
			$from->setValue($fromTimestamp);
			$list = $list->filter('LastEdited:GreaterThan', $from->Format('Y-m-d H:i:s'));
		}

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
	public function show(\SS_HTTPRequest $request) {
		$deployment = \DNDeployment::get()->byId($request->param('ID'));
		$errorResponse = $this->validateDeployment($deployment);
		if ($errorResponse instanceof \SS_HTTPResponse) {
			return $errorResponse;
		}
		return $this->getAPIResponse(['deployment' => $this->formatter->getDeploymentData($deployment)], 200);
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function delete(\SS_HTTPRequest $request) {
		if ($request->httpMethod() !== 'POST') {
			return $this->getAPIResponse(['message' => 'Method not allowed, requires POST'], 405);
		}

		$this->checkSecurityToken();

		$deployment = \DNDeployment::get()->byId($request->postVar('id'));
		$errorResponse = $this->validateDeployment($deployment);
		if ($errorResponse instanceof \SS_HTTPResponse) {
			return $errorResponse;
		}

		try {
			$deployment->getMachine()->apply(\DNDeployment::TR_DELETE);
		} catch (\Exception $e) {
			return $this->getAPIResponse([
				'message' => $e->getMessage()
			], 400);
		}

		return $this->getAPIResponse([
			'deployment' => $this->formatter->getDeploymentData($deployment),
			'message' => 'Deployment has been deleted'
		], 201);
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function log(\SS_HTTPRequest $request) {
		$deployment = \DNDeployment::get()->byId($request->param('ID'));
		$errorResponse = $this->validateDeployment($deployment);
		if ($errorResponse instanceof \SS_HTTPResponse) {
			return $errorResponse;
		}
		$log = $deployment->log();
		$lines = [];
		if ($log->exists()) {
			$lines = explode(PHP_EOL, $log->content());
		}

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
			'ref_name' => $currentBuild->RefName
		]);
		$deployment = $strategy->createDeployment();

		return $this->redirect($deployment->Link());
	}

	/**
	 * Return a summary of the deployment changes without creating the deployment.
	 *
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function summary(\SS_HTTPRequest $request) {
		if ($request->httpMethod() !== 'POST') {
			return $this->getAPIResponse(['message' => 'Method not allowed, requires POST'], 405);
		}
		$this->checkSecurityToken();

		$sha = $this->project->resolveRevision($request->postVar('ref'));
		if (!$sha) {
			return $this->getAPIResponse([
				'message' => 'The given reference could not be resolved. Does it exist in the repository?'
			], 400);
		}

		$options = ['sha' => $sha];
		if ($request->postVar('options')) {
			foreach (explode(',', $request->postVar('options')) as $option) {
				$options[$option] = true;
			}
		}

		$strategy = $this->createStrategy($options);
		return $this->getAPIResponse($strategy->toArray(), 201);
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

		$sha = $this->project->resolveRevision($request->postVar('ref'));
		if (!$sha) {
			return $this->getAPIResponse([
				'message' => 'The given reference could not be resolved. Does it exist in the repository?'
			], 400);
		}

		// if a ref name was given that is not the sha, then set that. It could be a branch,
		// or tag name, or anything else that git uses as a named reference
		$refName = null;
		if ($request->postVar('ref_name') !== $request->postVar('ref')) {
			$refName = $request->postVar('ref_name');
		}

		$options = [
			'sha' => $sha,
			'ref_type' => $request->postVar('ref_type'),
			'ref_name' => $refName,
			'title' => $request->postVar('title'),
			'summary' => $request->postVar('summary')
		];

		if ($request->postVar('options')) {
			foreach (explode(',', $request->postVar('options')) as $option) {
				$options[$option] = true;
			}
		}

		$strategy = $this->createStrategy($options);

		$approver = Member::get()->byId($request->postVar('approver_id'));
		if ($approver && $approver->exists()) {
			if (!$this->project->allowed(ApprovalsDispatcher::ALLOW_APPROVAL, $approver)) {
				return $this->getAPIResponse(['message' => 'The given approver does not have permissions to approve'], 403);
			}
		}

		if ($request->postVar('id')) {
			$deployment = $strategy->updateDeployment($request->postVar('id'));
			$message = 'Deployment has been updated';
			$statusCode = 200;
		} else {
			$deployment = $strategy->createDeployment();
			$message = 'Deployment has been created';
			$statusCode = 201;
		}

		if ($approver && $approver->exists()) {
			$deployment->ApproverID = $approver->ID;
			$deployment->write();
		}

		$deploymentLink = \Controller::join_links(Director::absoluteBaseURL(), $deployment->Link());

		$response = $this->getAPIResponse([
			'message' => $message,
			'location' => $deploymentLink,
			'deployment' => $this->formatter->getDeploymentData($deployment),
		], $statusCode);

		$response->addHeader('Location', $deploymentLink);

		return $response;
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

		$deployment = \DNDeployment::get()->byId($request->postVar('id'));
		$errorResponse = $this->validateDeployment($deployment);
		if ($errorResponse instanceof \SS_HTTPResponse) {
			return $errorResponse;
		}

		// The deployment cannot be started until it has been approved, or bypassed straight to approved state
		if ($deployment->State !== \DNDeployment::STATE_APPROVED) {
			return $this->getAPIResponse(['message' => 'This deployment has not been approved. Cannot deploy'], 403);
		}

		// until we have a system that can invalidate currently scheduled deployments due
		// to emergency deploys etc, replan the deployment to check if it's still valid.
		$options = $deployment->getDeploymentStrategy()->getOptions();
		$strategy = $this->environment->Backend()->planDeploy($this->environment, $options);
		$deployment->Strategy = $strategy->toJSON();

		// if the person starting is not the one who created the deployment, update the deployer
		if (Member::currentUserID() !== $deployment->DeployerID) {
			$deployment->DeployerID = Member::currentUserID();
		}

		try {
			$deployment->getMachine()->apply(\DNDeployment::TR_QUEUE);
		} catch (\Exception $e) {
			return $this->getAPIResponse([
				'message' => $e->getMessage()
			], 400);
		}

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
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function abort(\SS_HTTPRequest $request) {
		if ($request->httpMethod() !== 'POST') {
			return $this->getAPIResponse(['message' => 'Method not allowed, requires POST'], 405);
		}

		$this->checkSecurityToken();

		if (!self::can_abort_deployment($this->environment)) {
			return $this->getAPIResponse(['message' => 'You are not authorised to perform this action'], 403);
		}

		$deployment = \DNDeployment::get()->byId($request->postVar('id'));
		$errorResponse = $this->validateDeployment($deployment);
		if ($errorResponse instanceof \SS_HTTPResponse) {
			return $errorResponse;
		}

		try {
			$deployment->getMachine()->apply(\DNDeployment::TR_ABORT);
		} catch (\Exception $e) {
			return $this->getAPIResponse([
				'message' => $e->getMessage()
			], 400);
		}

		return $this->sendResponse([
			'message' => 'Deployment abort request successfully received',
			'deployment' => $this->formatter->getDeploymentData($deployment)
		], 200);
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
	 * @var array
	 * @return \DeploymentStrategy
	 */
	protected function createStrategy($options) {
		$strategy = $this->environment->Backend()->planDeploy($this->environment, $options);
		$data = $strategy->toArray();

		$interface = $this->project->getRepositoryInterface();
		if ($interface instanceof \ArrayData && $this->canCompareCodeVersions($interface, $data['changes'])) {
			$compareurl = sprintf(
				'%s/compare/%s...%s',
				$interface->URL,
				$data['changes']['Code version']['from'],
				$data['changes']['Code version']['to']
			);
			$data['changes']['Code version']['compareUrl'] = $compareurl;

			// special case for .platform.yml field so we don't show a huge blob of changes,
			// but rather a link to where the .platform.yml changes were made in the code
			if (isset($data['changes']['.platform.yml other'])) {
				$data['changes']['.platform.yml other']['compareUrl'] = $compareurl;
				$data['changes']['.platform.yml other']['description'] = '';
			}
		}
		$this->extend('updateDeploySummary', $data);

		// Ensure changes that would have been updated are persisted in the object,
		// such as the comparison URL, so that they will be written to the Strategy
		// field on the DNDeployment object as part of {@link createDeployment()}
		$strategy->setChanges($data['changes']);

		return $strategy;
	}

	/**
	 * @param ArrayData $interface
	 * @param $changes
	 * @return bool
	 */
	protected function canCompareCodeVersions(\ArrayData $interface, $changes) {
		if (empty($changes['Code version'])) {
			return false;
		}
		$codeVersion = $changes['Code version'];
		if (empty($interface)) {
			return false;
		}
		if (empty($interface->URL)) {
			return false;
		}
		if (empty($codeVersion['from']) || empty($codeVersion['to'])) {
			return false;
		}
		if (strlen($codeVersion['from']) !== 40 || strlen($codeVersion['to']) !== 40) {
			return false;
		}
		return true;
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
