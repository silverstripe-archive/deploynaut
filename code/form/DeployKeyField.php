<?php

/**
 * Class DeployKeyField
 *
 * Allows a cms admin to generate a public & private kaypair for a project.
 */
class DeployKeyField extends ReadonlyField {

	private static $allowed_actions = [
		'generate',
		'check',
		'key',
	];

	private static $url_handlers = [
		'check/$Token!' => 'check',
	];

	/**
	 * This dictates whether or not the 'generate' button will be shown.
	 *
	 * @var bool
	 */
	protected $showButton = false;


	/**
	 * @return SS_HTTPResponse|void
	 */
	public function generate() {
		if(!$project = $this->canGenerate()) {
			return $this->httpError(403, 'Forbidden');
		}

		$filter = FileNameFilter::create();
		$name = $filter->filter($project->Name);

		$token = Resque::enqueue('Create Keypair', 'CreateKeypair', [
			'keyDir' => $project->getKeyDir(),
			'name' => $name,
			'overwrite' => false,
		], true);
		$url = Controller::join_links($this->Link('check'), $token);

		$job = new Resque_Job_Status($token);
		// Encode our data to send back to the browser.
		$body = json_encode([
			'token' => $token,
			'href' => $url
		]);

		$response = new SS_HTTPResponse($body, 200);
		$response->addHeader('Content-Type', 'application/json');
		return $response;
	}


	/**
	 * @return SS_HTTPResponse|void
	 */
	public function check() {
		if(!$project = $this->canGenerate()) {
			return $this->httpError(403, 'Forbidden');
		}

		$token = $this->getRequest()->param('Token');
		$job = new Resque_Job_Status($token);
		$jobStatus = $job->get();

		switch($jobStatus) {
			case Resque_Job_Status::STATUS_WAITING:
				$status = 'waiting';
				break;
			case Resque_Job_Status::STATUS_RUNNING:
				$status = 'running';
				break;
			case Resque_Job_Status::STATUS_FAILED:
				$status = 'failed';
				break;
			case Resque_Job_Status::STATUS_COMPLETE:
				$status = 'complete';
				break;
			default:
				$status = false;
		}
		$body = json_encode(['status' => $status]);

		$response = new SS_HTTPResponse($body, 200);
		$response->addHeader('Content-Type', 'application/json');
		return $response;
	}


	/**
	 * @return SS_HTTPResponse|void
	 */
	public function key() {
		if(!$project = $this->canGenerate()) {
			return $this->httpError(403, 'Forbidden');
		}

		$body = json_encode(['public_key' => $project->getPublicKey()]);

		$response = new SS_HTTPResponse($body, 200);
		$response->addHeader('Content-Type', 'application/json');
		return $response;
	}


	/**
	 * @param array $properties
	 * @return string
	 */
	public function Field($properties = []) {
		Requirements::javascript('deploynaut/js/deploykeyfield.js');
		Requirements::css('deploynaut/js/deploykeyfield.css');
		return parent::Field($properties);
	}


	/**
	 * @return array|string
	 */
	public function Value() {
		if(!$this->value) {
			return 'No public key';
		}
		return Convert::raw2xml($this->value);
	}


	/**
	 * @return mixed
	 */
	public function getGenerateButton() {
		return FormAction::create('generate', 'Generate')
			->setUseButtonTag(true)
			->setAttribute('data-api-url', $this->Link('generate'))
			->setAttribute('data-key-url', $this->Link('key'));
	}


	/**
	 * @param $bool
	 * @return $this
	 */
	public function setShowButton($bool) {
		$this->showButton = $bool;
		return $this;
	}


	/**
	 * @return bool
	 */
	public function getShowButton() {
		return $this->showButton;
	}


	/**
	 * @return bool|DataObject|void
	 */
	protected function canGenerate() {
		if(!Permission::check('ADMIN')) {
			return $this->httpError(403, 'Forbidden');
		}

		$id = $this->getRequest()->param('ID');
		$project = DNProject::get()->byid($id);

		// Ensure the project exists
		if(!$project) {
			return false;
		}

		// Ensure we have permission. This is just in case the admin check gets removed (safety net).
		if(!$project->canEdit()) {
			return false;
		}

		return $project;
	}
}
