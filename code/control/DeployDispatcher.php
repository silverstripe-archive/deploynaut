<?php

/**
 * This dispatcher takes care of updating and returning information about this
 * projects git repository
 */
class DeployDispatcher extends Dispatcher {

	const ACTION_DEPLOY = 'deploy';

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
		'history'
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
			return $this->getAPIResponse(['message' => 'No deploy history'], 404);
		}

		foreach ($list as $deployment) {
			$data[] = [
				'CreatedDate' => $deployment->Created,
				'Branch' => $deployment->Branch,
				'Tags' => $deployment->getTags()->toArray(),
				'Changes' => $deployment->getDeploymentStrategy()->getChanges(),
				'CommitMessage' => $deployment->getCommitMessage(),
				'Deployer' => $deployment->Deployer()->getName(),
				'Approver' => $deployment->Approver()->getName(),
				'State' => $deployment->State,
			];
		}

		return $this->getAPIResponse(
			[
				'list' => $data,
				'pagelength' => $list->getPageLength(),
				'pagestart' => $list->getPageStart(),
				'totalpages' => $list->TotalPages(),
				'currentpage' => $list->CurrentPage()
			],
			200
		);
	}

	/**
	 * @return string
	 */
	public function Link() {
		return \Controller::join_links($this->project->Link(), self::ACTION_DEPLOY);
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
