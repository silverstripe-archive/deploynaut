<?php

/**
 * This dispatcher takes care of updating and returning information about this
 * projects git repository
 */
class GitDispatcher extends Dispatcher {

	const ACTION_GIT = 'git';

	/**
	 * @var array
	 */
	public static $allowed_actions = [
		'update',
		'show'
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
		self::ACTION_GIT
	];

	public function init() {
		parent::init();

		$this->project = $this->getCurrentProject();

		if (!$this->project) {
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
		return $this->redirect(\Controller::join_links($this->Link(), 'show'), 302);
	}

	/**
	 * @param SS_HTTPRequest $request
	 * @return SS_HTTPResponse
	 */
	public function update(SS_HTTPRequest $request) {
		switch ($request->httpMethod()) {
			case 'POST':
				$this->checkSecurityToken();
				return $this->createUpdate();
			case 'GET':
				return $this->getUpdateStatus($this->getRequest()->param('ID'));
			default:
				return $this->getAPIResponse(['message' => 'Method not allowed, requires POST or GET/{id}'], 405);
		}
	}

	/**
	 * @param SS_HTTPRequest $request
	 *
	 * @return string
	 */
	public function show(\SS_HTTPRequest $request) {

		$refs = [];
		$order = 0;
		$refs[] = [
			'id' => ++$order,
			'label' => "Branch version",
			"description" => "Deploy the latest version of a branch",
			"list" => $this->getGitBranches($this->project)
		];

		$refs[] = [
			'id' => ++$order,
			'label' => "Tag version",
			"description" => "Deploy a tagged release",
			"list" => $this->getGitTags($this->project)
		];

		// @todo: the original was a tree that was keyed by environment, the
		// front-end dropdown needs to be changed to support that. brrrr.
		$prevDeploys = [];
		foreach ($this->getGitPrevDeploys($this->project) as $env) {
			foreach ($env as $deploy) {
				$prevDeploys[] = $deploy;
			}
		}
		$refs[] = [
			'id' => ++$order,
			'label' => "Redeploy a release that was previously deployed (to any environment",
			"description" => "Deploy a previous release",
			"list" => $prevDeploys
		];

		return $this->getAPIResponse(['refs' => $refs], 200);
	}

	/**
	 * @return string
	 */
	public function Link() {
		return \Controller::join_links($this->project->Link(), self::ACTION_GIT);
	}

	/**
	 * @param string $name
	 *
	 * @return array
	 */
	public function getModel($name = '') {
		return [];
	}

	/**
	 * @param int $ID
	 * @return SS_HTTPResponse
	 */
	protected function getUpdateStatus($ID) {
		$ping = DNGitFetch::get()->byID($ID);
		if (!$ping) {
			return $this->getAPIResponse(['message' => 'GIT update (' . $ID . ') not found'], 404);
		}
		$output = [
			'id' => $ID,
			'status' => $ping->ResqueStatus(),
			'message' => array_filter(explode(PHP_EOL, $ping->LogContent()))
		];

		return $this->getAPIResponse($output, 200);
	}

	/**
	 * @return SS_HTTPResponse
	 */
	protected function createUpdate() {
		/** @var DNGitFetch $fetch */
		$fetch = DNGitFetch::create();
		$fetch->ProjectID = $this->project->ID;
		$fetch->write();
		$fetch->start();

		$location = Director::absoluteBaseURL() . $this->Link() . '/update/' . $fetch->ID;
		$output = [
			'message' => 'git fetch has been queued',
			'id' => $fetch->ID,
			'location' => $location,
		];

		$response = $this->getAPIResponse($output, 201);
		$response->addHeader('Location', $location);
		return $response;
	}

	/**
	 * @param $project
	 *
	 * @return array
	 */
	protected function getGitBranches($project) {
		$branches = [];
		foreach ($project->DNBranchList() as $branch) {
			$branches[] = [
				'key' => $branch->SHA(),
				'value' => $branch->Name(),
			];
		}
		return $branches;
	}

	/**
	 * @param $project
	 *
	 * @return array
	 */
	protected function getGitTags($project) {
		$tags = [];
		foreach ($project->DNTagList()->setLimit(null) as $tag) {
			$tags[] = [
				'key' => $tag->SHA(),
				'value' => $tag->Name(),
			];
		}
		return $tags;
	}

	/**
	 * @param $project
	 *
	 * @return array
	 */
	protected function getGitPrevDeploys($project) {
		$redeploy = [];
		foreach ($project->DNEnvironmentList() as $dnEnvironment) {
			$envName = $dnEnvironment->Name;
			$perEnvDeploys = [];
			foreach ($dnEnvironment->DeployHistory() as $deploy) {
				$sha = $deploy->SHA;

				// Check if exists to make sure the newest deployment date is used.
				if (!isset($perEnvDeploys[$sha])) {
					$pastValue = sprintf(
						"%s (deployed %s)",
						substr($sha, 0, 8),
						$deploy->obj('LastEdited')->Ago()
					);
					$perEnvDeploys[$sha] = [
						'key' => $sha,
						'value' => $pastValue
					];
				}
			}
			if (!empty($perEnvDeploys)) {
				$redeploy[$envName] = array_values($perEnvDeploys);
			}
		}
		return $redeploy;
	}

}
