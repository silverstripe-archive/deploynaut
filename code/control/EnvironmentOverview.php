<?php

/**
 * This aims to be a simple controller that only kicks off the rendering on the react
 * components. It passes a model to the frontend with URLS to dispatchers that takes
 * care of various actions, like git fetching, planning, approvals and so on.
 */
class EnvironmentOverview extends Dispatcher {

	const ACTION_OVERVIEW = 'overview';

	/**
	 * @var array
	 */
	private static $action_types = [
		self::ACTION_OVERVIEW
	];

	public function init() {
		parent::init();
		$this->project = $this->getCurrentProject();
		if (!$this->project) {
			return $this->project404Response();
		}
		// Performs canView permission check by limiting visible projects
		$this->environment = $this->getCurrentEnvironment($this->project);
	}

	/**
	 *
	 * @param \SS_HTTPRequest $request
	 *
	 * @return \HTMLText|\SS_HTTPResponse
	 */
	public function index(\SS_HTTPRequest $request) {
		if (!$this->environment) {
			return $this->environment404Response();
		}

		$this->setCurrentActionType(self::ACTION_OVERVIEW);

		return $this->customise([
			'Environment' => $this->environment
		])->renderWith(['EnvironmentOverview', 'DNRoot']);
	}

	/**
	 * @return string
	 */
	public function Link() {
		return $this->environment->Link();
	}

	/**
	 * The model includes the CSRF tokens and the various API
	 * endpoints that the front end might be interested in.
	 *
	 * @param string $name
	 *
	 * @return array
	 */
	public function getModel($name = '') {
		$base = Director::absoluteBaseURL();
		return [
			'dispatchers' => [
				'git' => $base . $this->getCurrentProject()->Link('git'),
				'plan' => $base . $this->getCurrentEnvironment()->Link('plan'),
				'deploys' => $base . $this->getCurrentEnvironment()->Link('deploys')
			],
			'api_auth' => [
				'name' => $this->getSecurityToken()->getName(),
				'value' => $this->getSecurityToken()->getValue()
			]
		];
	}

}
