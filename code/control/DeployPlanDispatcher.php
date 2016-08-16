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
		'gitupdate',
		'gitrefs',
		'deploysummary'
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
	 * @return SS_HTTPResponse
	 */
	public function gitupdate(SS_HTTPRequest $request) {
		switch($request->httpMethod()) {
			case 'POST':
				return $this->createFetch();
			case 'GET':
				return $this->getFetch($this->getRequest()->param('ID'));
			default:
				return $this->getAPIResponse('Method not allowed, requires POST or GET/{id}', 405);
		}
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
	 * @param int $ID
	 * @return SS_HTTPResponse
	 */
	protected function getFetch($ID) {
		$ping = DNGitFetch::get()->byID($ID);
		if(!$ping) {
			return $this->getAPIResponse('Fetch not found', 404);
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
	protected function createFetch() {
		/** @var DNGitFetch $fetch */
		$fetch = DNGitFetch::create();
		$fetch->ProjectID = $this->project->ID;
		$fetch->write();
		$fetch->start();

		$location = Director::absoluteBaseURL() . $this->Link() . '/gitupdate/' . $fetch->ID;
		$output = array(
			'message' => 'Fetch queued as job ' . $fetch->ResqueToken,
			'href' => $location,
		);

		$response = $this->getAPIResponse($output, 201);
		$response->addHeader('Location', $location);
		return $response;
	}

	/**
	 * @param SS_HTTPRequest $request
	 *
	 * @return SS_HTTPResponse
	 */
	public function deploysummary(SS_HTTPRequest $request) {
		if(!trim($request->getBody())) {
			return $this->getAPIResponse('no body was sent in the request', 400);
		}

		$jsonBody = json_decode($request->getBody(), true);
		if(empty($jsonBody)) {
			return $this->getAPIResponse('request did not contain a parsable JSON payload', 400);
		}

		$options = [
			'sha' => $jsonBody['sha']
		];

		$strategy = $this->environment->Backend()->planDeploy($this->environment, $options);
		$data = $strategy->toArray();

		$interface = $this->project->getRepositoryInterface();
		if($this->canCompareCodeVersions($interface, $data['changes']['Code version'])) {
			$compareurl = sprintf(
				'%s/compare/%s...%s',
				$interface->URL,
				$data['changes']['Code version']['from'],
				$data['changes']['Code version']['to']
			);
			$data['changes']['Code version']['compareUrl'] = $compareurl;
		}

		// Append json to response
		$token = SecurityToken::inst();
		$data['SecurityID'] = $token->getValue();

		$this->extend('updateDeploySummary', $data);

		return json_encode($data);
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

	/**
	 * Return a simple response with a message
	 *
	 * @param string $message
	 * @param int $statusCode
	 * @return SS_HTTPResponse
	 */
	protected function getAPIResponse($message, $statusCode) {
		$output = [
			'message' => $message,
			'status_code' => $statusCode
		];
		$body = json_encode($output, JSON_PRETTY_PRINT);
		$response = $this->getResponse();
		$response->addHeader('Content-Type', 'application/json');
		$response->setBody($body);
		$response->setStatusCode($statusCode);
		return $response;
	}

	/**
	 * @param ArrayData $interface
	 * @param array $codeVersion
	 *
	 * @return bool
	 */
	protected function canCompareCodeVersions(\ArrayData $interface, $codeVersion) {
		if(empty($interface)) {
			return false;
		}
		if(empty($interface->URL)) {
			return false;
		}
		if(empty($codeVersion['from']) || empty($codeVersion['to'])) {
			return false;
		}
		if(strlen($codeVersion['from']) !== 40 || strlen($codeVersion['to']) !== 40) {
			return false;
		}
		return true;
	}
}
