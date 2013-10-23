<?php

class APIEnvironment extends APINoun {
	
	/**
	 *
	 * @var array
	 */
	private static $allowed_actions = array(
		'ping'
	);

	/**
	 * 
	 * @param SS_HTTPRequest $request
	 * @return SS_HTTPResponse
	 */
	public function index(SS_HTTPRequest $request) {
		if(!$this->record->canView($this->getMember())) {
			return $this->error('You are not authorized to this environment', 403);
		}
		switch($request->httpMethod()) {
			case 'GET':
				return $this->getAPIResponse($this->record->toMap());
				break;
			default:
				return $this->error('API not found', 404);
				break;
		}
	}
	
	/**
	 * 
	 * @param SS_HTTPRequest $request
	 */
	public function ping(SS_HTTPRequest $request) {
		if(!$this->record->canView($this->getMember())) {
			return $this->error('You are not authorized to do that on this environment', 403);
		}
		switch($request->httpMethod()) {
			case 'GET':
				return $this->getPing($this->getRequest()->param('ID'));
				break;
			case 'POST':
				return $this->createPing();
				break;
			default:
				return $this->error('API not found', 404);
				break;
		}
	}
	
	/**
	 * 
	 * @return SS_HTTPResponse
	 */
	protected function showRecord() {
		return $this->getAPIResponse($this->record->toMap());
	}
	
	/**
	 * 
	 * @param string $message
	 * @param int $statusCode
	 */
	protected function error($message, $statusCode) {
		$response =  $this->getAPIResponse(array(
			'message' => $message,
			'statusCode' => $statusCode
		));
		$response->setStatusCode($statusCode);
		return $response;
	}
	
	/**
	 * 
	 * @param SS_HTTPRequest $request
	 */
	protected function createPing() {
		if(!$this->record->canDeploy($this->getMember())) {
			return $this->error('You are not authorized to do that on this environment', 403);
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
	 */
	protected function getPing($ID) {
		$ping = DNPing::get()->byID($ID);
		if(!$ping) {
			return $this->error('Ping not found', 404);
		}
		$output = array(
			'status' => $ping->ResqueStatus(),
			'message' => $ping->LogContent()
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
	 * @return string
	 */
	public function Link() {
		return Controller::join_links(
			$this->parent->Link(),
			$this->record->Project()->Name,
			$this->record->Name
		);
	}
}
