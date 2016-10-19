<?php

class APIEnvironment extends APINoun {

	/**
	 * @var array
	 */
	private static $allowed_actions = array(
		'ping',
		'deploy'
	);

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function index(\SS_HTTPRequest $request) {
		if(!$this->record->canView($this->getMember())) {
			return $this->message('You are not authorized to view this environment', 403);
		}
		switch($request->httpMethod()) {
			case 'GET':
				$href = Director::absoluteURL($this->record->Project()->APILink($this->record->Name));
				return $this->getAPIResponse(array(
					"name" => $this->record->Name,
					"project" => $this->record->Project()->Name,
					"href" => $href,
					"created" => $this->record->Created,
					"last-edited" => $this->record->LastEdited,

					// Stolen from https://github.com/kevinswiber/siren spec
					"actions" => array(
						array(
							"name" => "deploy",
							"method" =>  "POST",
							"href" => "$href/deploy",
							"type" => "application/json",
							"fields" => array(
								array("name" => "release", "type" => "text"),
							),
						)
					)
				));
			default:
				return $this->message('API not found', 404);
		}
	}

	/**
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function ping(\SS_HTTPRequest $request) {
		if(!$this->record->canView($this->getMember())) {
			return $this->message('You are not authorized to do that on this environment', 403);
		}
		switch($request->httpMethod()) {
			case 'GET':
				return $this->getPing($this->getRequest()->param('ID'));
			case 'POST':
				return $this->createPing();
			default:
				return $this->message('API not found', 404);
		}
	}

	/**
	 * @deprecated 2.0.0 - moved to DeployDispatcher
	 *
	 * @param \SS_HTTPRequest $request
	 * @return \SS_HTTPResponse
	 */
	public function deploy(\SS_HTTPRequest $request) {
		if(!$this->record->canView($this->getMember())) {
			return $this->message('You are not authorized to do that on this environment', 403);
		}
		switch($request->httpMethod()) {
			case 'GET':
				return $this->getDeploy($this->getRequest()->param('ID'));
			case 'POST':
				return $this->createDeploy();
			default:
				return $this->message('API not found', 404);
		}
	}

	/**
	 * @return string
	 */
	public function Link() {
		return Controller::join_links(
			$this->parent->Link(),
			$this->record->Project()->Name,
			$this->record->Name
		);
	}

	/**
	 * @return SS_HTTPResponse
	 */
	protected function showRecord() {
		return $this->getAPIResponse($this->record->toMap());
	}

	/**
	 * @return SS_HTTPResponse
	 */
	protected function createPing() {
		if(!$this->record->canDeploy($this->getMember())) {
			return $this->message('You are not authorized to do that on this environment', 403);
		}
		$ping = DNPing::create();
		$ping->EnvironmentID = $this->record->ID;
		$ping->write();
		$ping->start();

		$location = Director::absoluteBaseURL() . $this->Link() . '/ping/' . $ping->ID;
		$output = array(
			'message' => 'Ping queued as job ' . $ping->ResqueToken,
			'href' => $location,
		);

		$response = $this->getAPIResponse($output);
		$response->setStatusCode(201);
		$response->addHeader('Location', $location);
		return $response;
	}

	/**
	 * @param int $ID
	 * @return SS_HTTPResponse
	 */
	protected function getPing($ID) {
		$ping = DNPing::get()->byID($ID);
		if(!$ping) {
			return $this->message('Ping not found', 404);
		}
		$output = array(
			'status' => $ping->ResqueStatus(),
			'message' => $ping->LogContent()
		);

		return $this->getAPIResponse($output);
	}

	/**
	 * @deprecated 2.0.0 - moved to DeployDispatcher
	 *
	 * @return SS_HTTPResponse
	 */
	protected function createDeploy() {
		if(!$this->record->canDeploy($this->getMember())) {
			return $this->message('You are not authorized to do that on this environment', 403);
		}

		$reqBody = $this->getRequestBody();

		if($reqBody === null) {
			return $this->message('the request body did not contain a valid JSON object.', 400);
		}

		if(empty($reqBody['release'])) {
			return $this->message('deploy requires a {"release": "sha1"} in the body of the request.', 400);
		}

		$strategy = new DeploymentStrategy($this->record, array(
			'sha' => $reqBody['release']
		));
		$deploy = $strategy->createDeployment();
		$deploy->start();
		$location = Director::absoluteBaseURL() . $this->Link() . '/deploy/' . $deploy->ID;
		$output = array(
			'message' => 'Deploy queued as job ' . $deploy->ResqueToken,
			'href' => $location,
		);
		$response = $this->getAPIResponse($output);
		$response->setStatusCode(201);
		$response->addHeader('Location', $location);
		return $response;
	}

	/**
	 * @deprecated 2.0.0 - moved to DeployDispatcher
	 *
	 * @param int $id
	 * @return SS_HTTPResponse
	 */
	protected function getDeploy($id) {
		$deploy = DNDeployment::get()->byID($id);
		if(!$deploy) {
			return $this->message('Deploy not found', 404);
		}
		$output = array(
			'status' => $deploy->ResqueStatus(),
			'message' => $deploy->LogContent()
		);

		return $this->getAPIResponse($output);
	}
}
