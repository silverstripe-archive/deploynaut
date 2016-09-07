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
	private static $action_types = [
		self::ACTION_DEPLOY
	];

	/**
	 * @var array
	 */
	public static $allowed_actions = [
		'history',
		'currentbuild',
		'start',
		'log'
	];

	/**
	 * @var \DNProject
	 */
	protected $project = null;

	/**
	 * @var \DNEnvironment
	 */
	protected $environment = null;

	public function init() {
		parent::init();

		$this->project = $this->getCurrentProject();

		if(!$this->project) {
			return $this->project404Response();
		}

		// Performs canView permission check by limiting visible projects
		$this->environment = $this->getCurrentEnvironment($this->project);
		if(!$this->environment) {
			return $this->environment404Response();
		}
	}

	/**
	 *
	 * @param \SS_HTTPRequest $request
	 *
	 * @return \HTMLText|\SS_HTTPResponse
	 */
	public function index(\SS_HTTPRequest $request) {
		return $this->redirect(\Controller::join_links($this->Link(), 'history'), 302);
	}

	/**
	 * @return SS_HTTPResponse
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

		$currentBuild = $this->environment->CurrentBuild();

		foreach ($list as $deployment) {
			$data[] = [
				'ID' => $deployment->ID,
				'CreatedDate' => $deployment->Created,
				'Branch' => $deployment->Branch,
				'Tags' => $deployment->getTags()->toArray(),
				'Changes' => $deployment->getDeploymentStrategy()->getChanges(),
				'SHA' => $deployment->SHA,
				'CommitMessage' => $deployment->getCommitMessage(),
				'CommitURL' => $deployment->getCommitURL(),
				'Deployer' => $deployment->Deployer()->getName(),
				'Approver' => $deployment->Approver()->getName(),
				'State' => $deployment->State,
				'IsCurrentBuild' => $currentBuild ? ($deployment->ID === $currentBuild->ID) : null
			];
		}

		return $this->getAPIResponse([
			'list' => $data,
			'pagelength' => $list->getPageLength(),
			'totalpages' => $list->TotalPages(),
			'currentpage' => $list->CurrentPage()
		], 200);
	}

	/**
	 * @return SS_HTTPResponse
	 */
	public function currentbuild(SS_HTTPRequest $request) {
		$currentBuild = $this->environment->CurrentBuild();
		if (!$currentBuild) {
			return $this->getAPIResponse(['build' => []], 200);
		}

		return $this->getAPIResponse(['build' => [
			'ID' => $currentBuild->ID,
			'CreatedDate' => $currentBuild->Created,
			'Branch' => $currentBuild->Branch,
			'Tags' => $currentBuild->getTags()->toArray(),
			'SHA' => $currentBuild->SHA,
			'CommitMessage' => $currentBuild->getCommitMessage(),
			'CommitURL' => $currentBuild->getCommitURL(),
		]], 200);
	}

	/**
	 *
	 * @param SS_HTTPRequest $request
	 *
	 * @return SS_HTTPResponse
	 * @throws ValidationException
	 * @throws null
	 */
	public function start(SS_HTTPRequest $request) {
		$this->checkSecurityToken();

		if(!$this->environment->canDeploy(Member::currentUser())) {
			return $this->getAPIResponse(['message' => 'You are not authorized to deploy this environment'], 403);
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

		$output = [
			'message' => 'deployment has been queued',
			'ID' => $deployment->ID,
			'location' => $location
		];
		$response = $this->getAPIResponse($output, 201);
		$response->addHeader('Location', $location);
		return $response;
	}

	/**
	 * Action - Get the latest deploy log
	 *
	 * @param SS_HTTPRequest $request
	 *
	 * @return string
	 * @throws SS_HTTPResponse_Exception
	 */
	public function log(SS_HTTPRequest $request) {
		$params = $request->params();
		$deployment = DNDeployment::get()->byId($params['ID']);
		if(!$deployment || !$deployment->ID) {
			throw new SS_HTTPResponse_Exception('Deployment not found', 404);
		}
		if(!$deployment->canView()) {
			return Security::permissionFailure();
		}
		if($this->environment->Name != $params['Environment']) {
			throw new LogicException("Environment in URL doesn't match this deploy");
		}
		if($this->project->Name != $params['Project']) {
			throw new LogicException("Project in URL doesn't match this deploy");
		}
		$log = $deployment->log();
		if($log->exists()) {
			$content = $log->content();
		} else {
			$content = 'Waiting for action to start';
		}

		$lines = explode(PHP_EOL, $content);

		return $this->getAPIResponse(['message' => $lines, 'status' => $deployment->ResqueStatus()], 200);
	}

	/**
	 * @param string $action
	 *
	 * @return string
	 */
	public function Link($action = '') {
		return \Controller::join_links($this->environment->Link(), self::ACTION_DEPLOY, $action);
	}

	/**
	 * @param string $name
	 *
	 * @return array
	 */
	public function getModel($name = '') {
		return [];
	}

}
