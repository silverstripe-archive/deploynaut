<?php

/**
 * This dispatchers takes care of the viewing and changing the deploy plan. This includes
 * the guessed changes for a deployment, the deployment notes written by the deployer etc.
 */
class PlanDispatcher extends Dispatcher {

	const ACTION_PLAN = 'plan';

	/**
	 * @var array
	 */
	public static $allowed_actions = [
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

	/**
	 * @var array
	 */
	private static $action_types = [
		self::ACTION_PLAN
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
	 *
	 * @param \SS_HTTPRequest $request
	 *
	 * @return \HTMLText|\SS_HTTPResponse
	 */
	public function index(\SS_HTTPRequest $request) {
		$this->setCurrentActionType(self::ACTION_PLAN);
		$this->httpError(404);
	}

	/**
	 * @param SS_HTTPRequest $request
	 *
	 * @return SS_HTTPResponse
	 */
	public function deploysummary(SS_HTTPRequest $request) {
		if (strtolower($request->httpMethod()) !== 'post') {
			return $this->getAPIResponse(['message' => 'Method not allowed, requires POST'], 405);
		}
		$this->checkSecurityToken();

		$options = ['sha' => $request->postVar('sha')];
		if ($request->requestVar('options')) {
			foreach (explode(',', $request->postVar('options')) as $option) {
				$options[$option] = 'true';
			}
		}

		$strategy = $this->environment->Backend()->planDeploy($this->environment, $options);
		$data = $strategy->toArray();

		$interface = $this->project->getRepositoryInterface();
		if ($this->canCompareCodeVersions($interface, $data['changes'])) {
			$compareurl = sprintf(
				'%s/compare/%s...%s',
				$interface->URL,
				$data['changes']['Code version']['from'],
				$data['changes']['Code version']['to']
			);
			$data['changes']['Code version']['compareUrl'] = $compareurl;
		}
		$this->extend('updateDeploySummary', $data);
		return $this->getAPIResponse($data, 201);
	}

	/**
	 * @return string
	 */
	public function Link() {
		return \Controller::join_links($this->environment->Link(), self::ACTION_PLAN);
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
	 * @param ArrayData $interface
	 * @param $changes
	 *
	 * @return bool
	 *
	 */
	protected function canCompareCodeVersions(\ArrayData $interface, $changes) {
		if (empty($changes['Code version'])) {
			return false;
		}
		$codeVersion = ['Code version'];
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

}
