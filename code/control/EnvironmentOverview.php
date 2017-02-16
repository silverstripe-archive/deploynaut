<?php

/**
 * This aims to be a simple controller that only kicks off the rendering on the react
 * components. It passes a model to the frontend with URLS to dispatchers that takes
 * care of various actions, like git fetching, planning, approvals and so on.
 */
class EnvironmentOverview extends Dispatcher {

	const ACTION_OVERVIEW = 'overview';

	/**
	 * The "deployment" action here should only go to index, it gets used by
	 * the frontend routing.
	 */
	private static $allowed_actions = [
		'deployment'
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
		$approversList = [];

		// virtual stacks have a special case in that they need to look at the base project
		// due to the team setup being on the base.
		if ($this->getCurrentProject() instanceof VirtualProject) {
			$baseProject = $this->getCurrentProject()->BaseProject();
		} else {
			$baseProject = $this->getCurrentProject();
		}

		if ($baseProject->hasMethod('listMembers')) {
			foreach ($baseProject->listMembers() as $data) {
				if ($baseProject->allowed(\ApprovalsDispatcher::ALLOW_APPROVAL, \Member::get()->byId($data['MemberID']))) {
					$approversList[$data['MemberID']] = [
						'id' => $data['MemberID'],
						'email' => $data['Email'],
						'role' => $data['RoleTitle'],
						'name' => $data['FullName']
					];
				}
			}
		}

		$base = Director::absoluteBaseURL();
		return [
			'basename' => Director::baseURL() . $this->getCurrentEnvironment()->Link(self::ACTION_OVERVIEW),
			'dispatchers' => [
				'git' => $base . $this->getCurrentProject()->Link('git'),
				'deploys' => $base . $this->getCurrentEnvironment()->Link('deploys'),
				'approvals' => $base . $this->getCurrentEnvironment()->Link('approvals')
			],
			'api_auth' => [
				'name' => $this->getSecurityToken()->getName(),
				'value' => $this->getSecurityToken()->getValue()
			],
			'environment' => [
				'id' => $this->environment->ID,
				'name' => $this->environment->Name,
				'project_name' => $this->getCurrentProject()->Name,
				'usage' => $this->environment->Usage,
				'supported_options' => $this->environment->getSupportedOptions()->map('name', 'defaultValue'),
				'approvers' => $approversList
			],
			'user' => [
				'can_approve' => \ApprovalsDispatcher::can_approve($this->getCurrentEnvironment()),
				'can_bypass_approval' => \ApprovalsDispatcher::can_bypass_approval($this->getCurrentEnvironment()),
				'can_abort_deployment' => \DeployDispatcher::can_abort_deployment($this->getCurrentEnvironment())
			]
		];
	}

}
