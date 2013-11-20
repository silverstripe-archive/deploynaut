<?php

class APIProject extends APINoun {

	/**
	 *
	 * @var array
	 */
	private static $allowed_actions = array(
		'index',
		'fetch'
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
		return $this->httpError(404, '404 - These aren\'t the droids you\'re looking for.');
	}
	
	/**
	 * 
	 * @param SS_HTTPRequest $request
	 * @return SS_HTTPResponse
	 */
	public function fetch(SS_HTTPRequest $request) {
		if(!$this->record->canView($this->getMember())) {
			return $this->message('You are not authorized to do that on this environment', 403);
		}
		switch($request->httpMethod()) {
			case 'GET':
				return $this->getFetch($this->getRequest()->param('ID'));
				break;
			case 'POST':
				return $this->createFetch();
				break;
			default:
				return $this->message('API not found', 404);
				break;
		}
	}
	
	/**
	 * 
	 * @param int $ID
	 * @return SS_HTTPResponse
	 */
	protected function getFetch($ID) {
		$ping = DNGitFetch::get()->byID($ID);
		if(!$ping) {
			return $this->message('Fetch not found', 404);
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
	protected function createFetch() {
		$fetch = new DNGitFetch();
		$fetch->ProjectID = $this->record->ID;
		$fetch->write();
		$fetch->start();

		$location = Director::absoluteBaseURL().$this->Link().'/fetch/'.$fetch->ID;
		$output = array(
			'message' => 'Ping queued as job ' . $fetch->ResqueToken,
			'location' => $location,
		);
		
		$response = $this->getAPIResponse($output);
		$response->setStatusCode(201);
		$response->addHeader('Location', $location);
		return $response;
	}
	
	/**
	 * @return string
	 */
	public function Link() {
		return Controller::join_links(
			$this->parent->Link(),
			$this->record->Name
		);
	}
}
