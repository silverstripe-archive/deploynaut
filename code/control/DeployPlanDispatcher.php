<?php


class DeployPlanDispatcher extends Dispatcher {

	const ACTION_PLAN = 'plan';

	/**
	 * @var array
	 */
	private static $action_types = [
		self::ACTION_PLAN
	];

	/**
	 * @var array
	 */
	public static $allowed_actions = [
		'gitrefs',
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
	 * @return string
	 */
	public function Link() {
		return \Controller::join_links($this->environment->Link(), self::ACTION_PLAN);
	}

	/**
	 *
	 * @param \SS_HTTPRequest $request
	 *
	 * @return \HTMLText|\SS_HTTPResponse
	 */
	public function index(\SS_HTTPRequest $request) {
		$this->setCurrentActionType(self::ACTION_PLAN);
		return $this->customise([
			'Environment' => $this->environment
		])->renderWith(['Plan', 'DNRoot']);
	}

	/**
	 * @param SS_HTTPRequest $request
	 *
	 * @return string
	 */
	public function gitrefs(\SS_HTTPRequest $request) {

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
		foreach($this->getGitPrevDeploys($this->project) as $env) {
			foreach($env as $deploy) {
				$prevDeploys[] = $deploy;
			}
		}
		$refs[] = [
			'id' => ++$order,
			'label' => "Redeploy a release that was previously deployed (to any environment",
			"description" => "Deploy a previous release",
			"list" => $prevDeploys
		];

		$body = json_encode($refs, JSON_PRETTY_PRINT);
		$this->getResponse()->addHeader('Content-Type', 'application/json');
		$this->getResponse()->setBody($body);
		return $body;
	}

	/**
	 * Generate the data structure used by the frontend component.
	 *
	 * @param string $name of the component
	 *
	 * @return array
	 */
	public function getModel($name) {
		return [
			'APIEndpoint' => Director::absoluteBaseURL().$this->Link()
		];
	}

	/**
	 * @param $project
	 *
	 * @return array
	 */
	protected function getGitBranches($project) {
		$branches = [];
		foreach($project->DNBranchList() as $branch) {
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
		foreach($project->DNTagList()->setLimit(null) as $tag) {
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
		foreach($project->DNEnvironmentList() as $dnEnvironment) {
			$envName = $dnEnvironment->Name;
			$perEnvDeploys = [];
			foreach($dnEnvironment->DeployHistory() as $deploy) {
				$sha = $deploy->SHA;

				// Check if exists to make sure the newest deployment date is used.
				if(!isset($perEnvDeploys[$sha])) {
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
			if(!empty($perEnvDeploys)) {
				$redeploy[$envName] = array_values($perEnvDeploys);
			}
		}
		return $redeploy;
	}
}
