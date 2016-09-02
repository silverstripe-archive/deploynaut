<?php

class APIProject extends APINoun {

	/**
	 * @var array
	 */
	private static $allowed_actions = array(
		'index',
		'fetch'
	);

	/**
	 * @param SS_HTTPRequest $request
	 * @return SS_HTTPResponse
	 */
	public function index(SS_HTTPRequest $request) {
		if(!$this->record->canView($this->getMember())) {
			return $this->message('You are not authorized to this environment', 403);
		}

		switch($request->httpMethod()) {
			case 'GET':
				$response = array(
					"name" => $this->record->Name,
					"href" => Director::absoluteURL($this->record->APILink("")),
					"created" => $this->record->Created,
					"last-edited" => $this->record->LastEdited,
					"disk-quota-mb" => $this->record->DiskQuotaMB,
					"environments" => array(),
				);
				foreach($this->record->DNEnvironmentList() as $environment) {
					$response['environments'][] = array(
						'name' => $environment->Name,
						'href' => Director::absoluteURL($this->record->APILink($environment->Name)),
					);
				}

				return $this->getAPIResponse($response);
			default:
				return $this->message('API not found', 404);
		}
	}

	/**
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
			case 'POST':
				return $this->createFetch();
			default:
				return $this->message('API not found', 404);
		}
	}

	/**
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
	 * @return SS_HTTPResponse
	 */
	protected function createFetch() {
		/** @var DNGitFetch $fetch */
		$fetch = DNGitFetch::create();
		$fetch->ProjectID = $this->record->ID;
		$fetch->write();
		$fetch->start();

		$location = Director::absoluteBaseURL() . $this->Link() . '/fetch/' . $fetch->ID;
		$output = array(
			'message' => 'Fetch queued as job ' . $fetch->ResqueToken,
			'href' => $location,
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
