<?php

/**
 * This dispatcher takes care of updating and returning information about this
 * projects git repository
 */
class GitDispatcher extends Dispatcher {

	const ACTION_GIT = 'git';

	const REF_TYPE_FROM_UAT = 0;
	const REF_TYPE_BRANCH = 1;
	const REF_TYPE_TAG = 2;
	const REF_TYPE_PREVIOUS = 3;
	const REF_TYPE_SHA = 4;

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

	private static $dependencies = [
		'formatter' => '%$DeploynautAPIFormatter'
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
	public function update(\SS_HTTPRequest $request) {
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
		$targetEnvironment = null;
		$targetEnvironmentId = $request->getVar('environmentId');
		if (!empty($targetEnvironmentId)) {
			$targetEnvironment = DNEnvironment::get()->byId((int) $targetEnvironmentId);
		}

		$refs = [];
		$prevDeploys = [];

		$uatEnvironment = $this->project->DNEnvironmentList()->filter('Usage', DNEnvironment::UAT)->first();
		$uatBuild = $uatEnvironment ? $uatEnvironment->CurrentBuild() : null;
		if ($uatBuild && $uatBuild->exists() && $targetEnvironment && $targetEnvironment->Usage === DNEnvironment::PRODUCTION) {
			$refs[self::REF_TYPE_FROM_UAT] = [
				'id' => self::REF_TYPE_FROM_UAT,
				'label' => 'Promote the version currently on UAT',
				'description' => 'Promote the version currently on UAT',
				'promote_build' => $this->formatter->getDeploymentData($uatBuild)
			];
		}

		$refs[self::REF_TYPE_BRANCH] = [
			'id' => self::REF_TYPE_BRANCH,
			'label' => 'Branch version',
			'description' => 'Deploy the latest version of a branch',
			'list' => $this->getGitBranches($this->project)
		];

		$refs[self::REF_TYPE_TAG] = [
			'id' => self::REF_TYPE_TAG,
			'label' => 'Tag version',
			'description' => 'Deploy a tagged release',
			'list' => $this->getGitTags($this->project)
		];

		// @todo: the original was a tree that was keyed by environment, the
		// front-end dropdown needs to be changed to support that. brrrr.
		foreach ($this->getGitPrevDeploys($this->project) as $env) {
			foreach ($env as $deploy) {
				$prevDeploys[] = $deploy;
			}
		}
		$refs[self::REF_TYPE_PREVIOUS] = [
			'id' => self::REF_TYPE_PREVIOUS,
			'label' => 'Redeploy a release that was previously deployed (to any environment)',
			'description' => 'Deploy a previous release',
			'list' => $prevDeploys
		];
		$refs[self::REF_TYPE_SHA] = [
			'id' => self::REF_TYPE_SHA,
			'label' => 'Deploy a specific SHA',
			'description' => 'Deploy a specific SHA'
		];

		$options = [];
		if ($targetEnvironment) {
			foreach ($targetEnvironment->getSupportedOptions() as $option) {
				$options[] = [
					'name' => $option->getName(),
					'title' => $option->getTitle(),
					'defaultValue' => $option->getDefaultValue()
				];
			}
		}

		// get the last time git fetch was run
		$lastFetchedDate = 'never';
		$lastFetchedAgo = null;
		$fetch = DNGitFetch::get()
			->filter([
				'ProjectID' => $this->project->ID,
				'Status' => 'Finished'
			])
			->sort('LastEdited', 'DESC')
			->first();
		if ($fetch) {
			$lastFetchedDate = $fetch->obj('LastEdited')->Date();
			$lastFetchedAgo = $fetch->obj('LastEdited')->Ago();
		}

		return $this->getAPIResponse([
			'refs' => $refs,
			'options' => $options,
			'last_fetched_date' => $lastFetchedDate,
			'last_fetched_ago' => $lastFetchedAgo
		], 200);
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
		$fetch = DNGitFetch::get()->byID($ID);
		if (!$fetch) {
			return $this->getAPIResponse(['message' => 'GIT update (' . $ID . ') not found'], 404);
		}
		$output = [
			'id' => $ID,
			'status' => $fetch->ResqueStatus(),
			'message' => array_filter(explode(PHP_EOL, $fetch->LogContent()))
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
			$sha = $branch->SHA();
			$name = $branch->Name();
			$branches[] = [
				'id' => $sha,
				'ref_name' => $name,
				'title' => sprintf('%s (%s, %s old)',
					$name,
					substr($sha, 0, 8),
					$branch->LastUpdated()->TimeDiff()
				)
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
				'id' => $tag->SHA(),
				'ref_name' => $tag->Name(),
				'title' => $tag->Name()
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
			foreach ($dnEnvironment->DeployHistory()->filter('State', \DNDeployment::STATE_COMPLETED) as $deploy) {
				$sha = $deploy->SHA;

				// Check if exists to make sure the newest deployment date is used.
				if (!isset($perEnvDeploys[$sha])) {
					$pastValue = sprintf(
						"%s (deployed %s)",
						substr($sha, 0, 8),
						$deploy->obj('LastEdited')->Ago()
					);
					$perEnvDeploys[$sha] = [
						'id' => $sha,
						'title' => $pastValue
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
