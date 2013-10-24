<?php

class APIEnvironment extends APINoun {
	
	/**
	 *
	 * @var array
	 */
	private static $allowed_actions = array(
		'ping',
		'deploy'
	);

	/**
	 * 
	 * @param SS_HTTPRequest $request
	 * @return SS_HTTPResponse
	 */
	public function index(SS_HTTPRequest $request) {
		if(!$this->record->canView($this->getMember())) {
			return $this->message('You are not authorized to this environment', 403);
		}
		switch($request->httpMethod()) {
			case 'GET':
				return $this->getAPIResponse($this->record->toMap());
				break;
			default:
				return $this->message('API not found', 404);
				break;
		}
	}
	
	/**
	 * 
	 * @param SS_HTTPRequest $request
	 * @return SS_HTTPResponse
	 */
	public function ping(SS_HTTPRequest $request) {
		if(!$this->record->canView($this->getMember())) {
			return $this->message('You are not authorized to do that on this environment', 403);
		}
		switch($request->httpMethod()) {
			case 'GET':
				return $this->getPing($this->getRequest()->param('ID'));
				break;
			case 'POST':
				return $this->createPing();
				break;
			default:
				return $this->message('API not found', 404);
				break;
		}
	}
	
	/**
	 * 
	 * @param SS_HTTPRequest $request
	 * @return SS_HTTPResponse
	 */
	public function deploy(SS_HTTPRequest $request) {
		if(!$this->record->canView($this->getMember())) {
			return $this->message('You are not authorized to do that on this environment', 403);
		}
		switch($request->httpMethod()) {
			case 'GET':
				return $this->getDeploy($this->getRequest()->param('ID'));
				break;
			case 'POST':
				return $this->createDeploy();
				break;
			default:
				return $this->message('API not found', 404);
				break;
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
	 * 
	 * @return SS_HTTPResponse
	 */
	protected function showRecord() {
		return $this->getAPIResponse($this->record->toMap());
	}
	
	/**
	 * Return a simple response with a message 
	 * 
	 * @param string $message
	 * @param int $statusCode
	 * @return SS_HTTPResponse
	 */
	protected function message($message, $statusCode) {
		$response =  $this->getAPIResponse(array(
			'message' => $message,
			'statusCode' => $statusCode
		));
		$response->setStatusCode($statusCode);
		return $response;
	}
	
	/**
	 * 
	 * @return SS_HTTPResponse
	 */
	protected function createPing() {
		if(!$this->record->canDeploy($this->getMember())) {
			return $this->message('You are not authorized to do that on this environment', 403);
		}
		$ping = new DNPing();
		$ping->EnvironmentID = $this->record->ID;
		$ping->write();
		$ping->start();
		
		$output = array(
			'message' => 'Ping queued as job ' . $ping->ResqueToken,
			'logurl' => Director::absoluteBaseURL().$this->Link().'/ping/'.$ping->ID,
		);
		
		return $this->getAPIResponse($output);
	}
	
	/**
	 * 
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
		
		$deploy = new DNDeployment();
		$deploy->EnvironmentID = $this->record->ID;
		$deploy->SHA = $reqBody['release'];
		$deploy->write();
		$deploy->start();
		$output = array(
			'message' => 'Deploy queued as job ' . $deploy->ResqueToken,
			'logurl' => Director::absoluteBaseURL().$this->Link().'/deploy/'.$deploy->ID,
		);
		return $this->getAPIResponse($output);
	}
	
	/**
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
	
	/**
	 * 
	 * @return bool
	 */
	protected function getAPIResponse($output) {
		$response = $this->getResponse();
		if($this->respondWithJSON()) {
			$body = Convert::raw2json($output);
			$response->addHeader('Content-Type', 'text/json');
		} else {
			$body = print_r($output, true);  
			$response->addHeader('Content-Type', 'text/text');
		}
		$response->setBody($body);
		return $response;
	}
	
	/**
	 * 
	 * @return boolean
	 */
	protected function respondWithJSON() {
		if($this->getRequest()->getExtension() == 'json') {
			return true;
		}
		if(strpos($this->getRequest()->getHeader('Accept'), 'application/json') !== false) {
			return true;
		}
		return false;
	}
	
	/**
	 * 
	 * @return array|null
	 */
	protected function getRequestBody() {
		return Convert::json2array($this->getRequest()->getBody());
	}
}
