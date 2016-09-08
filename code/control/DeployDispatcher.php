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
	public static $allowed_actions = [
		'history',
		'currentbuild',
		'show',
		'log',
		'start'
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
	public function history(SS_HTTPRequest $request) {
		$data = [];
		$list = $this->DeployHistory();
		$page = $request->getVar('page') ?: 1;
		if ($page > $list->TotalPages()) {
			$page = 1;
		}
		if ($page < 1) {
			$page = 1;
		}
		$start = ($page - 1) * $list->getPageLength();
		$list->setPageStart((int) $start);
		if (empty($list)) {
			return $this->getAPIResponse(['list' => []], 200);
		}

		foreach ($list as $deployment) {
			$data[] = $this->getDeploymentData($deployment);
		}

		return $this->getAPIResponse([
			'list' => $data,
			'page_length' => $list->getPageLength(),
			'total_pages' => $list->TotalPages(),
			'current_page' => $list->CurrentPage()
		], 200);
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function currentbuild(SS_HTTPRequest $request) {
		$currentBuild = $this->environment->CurrentBuild();
		if (!$currentBuild) {
			return $this->getAPIResponse(['deployment' => []], 200);
		}
		return $this->getAPIResponse(['deployment' => $this->getDeploymentData($currentBuild)], 200);
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function show(SS_HTTPRequest $request) {
		$deployment = DNDeployment::get()->byId($request->param('ID'));
		if (!$deployment || !$deployment->exists()) {
			return $this->getAPIResponse(['message' => 'This deployment does not exist'], 404);
		}
		if (!$deployment->canView()) {
			return $this->getAPIResponse(['message' => 'You are not authorised to view this deployment'], 403);
		}
		return $this->getAPIResponse(['deployment' => $this->getDeploymentData($deployment)], 200);
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function log(SS_HTTPRequest $request) {
		$deployment = DNDeployment::get()->byId($request->params('ID'));
		if (!$deployment || !$deployment->exists) {
			return $this->getAPIResponse(['message' => 'This deployment does not exist'], 404);
		}
		if (!$deployment->canView()) {
			return $this->getAPIResponse(['message' => 'You are not authorised to view this deployment'], 403);
		}

		$log = $deployment->log();
		$content = $log->exists() ? $log->content() : 'Waiting for action to start';
		$lines = explode(PHP_EOL, $content);

		return $this->getAPIResponse(['message' => $lines, 'status' => $deployment->Status], 200);
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function start(SS_HTTPRequest $request) {
		$this->checkSecurityToken();

		if (!$this->environment->canDeploy(Member::currentUser())) {
			return $this->getAPIResponse(['message' => 'You are not authorised to deploy this environment'], 403);
		}

		// @todo the strategy should have been saved when there has been a request for an
		// approval or a bypass. This saved state needs to be checked if it's invalidated
		// if another deploy happens before this one
		$options = [
			'sha' => $request->requestVar('sha'),
		];
		$strategy = $this->environment->Backend()->planDeploy($this->environment, $options);

		$strategy->fromArray($request->requestVars());
		$deployment = $strategy->createDeployment();

		// Skip through the approval state for now.
		$deployment->getMachine()->apply(DNDeployment::TR_SUBMIT);
		$deployment->getMachine()->apply(DNDeployment::TR_QUEUE);

		$location = \Controller::join_links(Director::absoluteBaseURL(), $this->Link('log'), $deployment->ID);

		$response = $this->getAPIResponse([
			'message' => 'deployment has been queued',
			'id' => $deployment->ID,
			'location' => $location
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
	 * Return data about a single deployment for use in API response.
	 * @param DNDeployment $deployment
	 * @return array
	 */
	protected function getDeploymentData(DNDeployment $deployment) {
		$currentBuild = $this->environment->CurrentBuild();

		$deployer = $deployment->Deployer();
		$deployerData = null;
		if ($deployer && $deployer->exists()) {
			$deployerData = $this->getStackMemberData($deployer);
		}
		$approver = $deployment->Approver();
		$approverData = null;
		if ($approver && $approver->exists()) {
			$approverData = $this->getStackMemberData($approver);
		}

		return [
			'id' => $deployment->ID,
			'created' => $deployment->Created,
			'date_planned' => $deployment->DatePlanned,
			'summary' => $deployment->Summary,
			'branch' => $deployment->Branch,
			'tags' => $deployment->getTags()->toArray(),
			'changes' => $deployment->getDeploymentStrategy()->getChanges(),
			'sha' => $deployment->SHA,
			'commit_message' => $deployment->getCommitMessage(),
			'commit_url' => $deployment->getCommitURL(),
			'deployer' => $deployerData,
			'approver' => $approverData,
			'state' => $deployment->State,
			'is_current_build' => $currentBuild ? ($deployment->ID === $currentBuild->ID) : null
		];
	}

	/**
	 * Return data about a particular {@link Member} of the stack for use in API response.
	 * Note that role can be null in the response. This is the case of an admin, or an operations
	 * user who can create the deployment but is not part of the stack roles.
	 *
	 * @param Member $member
	 * @return array
	 */
	protected function getStackMemberData(Member $member) {
		$stackMembers = $this->project->listMembers();
		$role = null;

		foreach ($stackMembers as $stackMember) {
			if ($stackMember['MemberID'] !== $member->ID) {
				continue;
			}

			$role = $stackMember['RoleTitle'];
		}

		return [
			'id' => $member->ID,
			'email' => $member->Email,
			'role' => $role,
			'name' => $member->getName()
		];
	}

}
