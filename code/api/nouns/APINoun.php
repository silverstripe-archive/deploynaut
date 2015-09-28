<?php
/**
 * Base class for the APINouns
 */
class APINoun extends Controller {

	/**
	 * @var controller
	 */
	protected $parent = null;

	/**
	 * @var DataObject
	 */
	protected $record = null;

	/**
	 * @var Member
	 */
	protected $member = null;

	/**
	 * Holds the url segment for this admin
	 *
	 * @param Controller|null $parent
	 * @param DataObject|null $record
	 */
	public function __construct(\Controller $parent = null, DataObject $record = null) {
		$this->record = $record;
		$this->parent = $parent;
		parent::__construct();
	}

	/**
	 * Enable basic auth on the API
	 */
	public function init() {
		$this->member = BasicAuth::requireLogin('Deploynaut API');
		parent::init();
	}

	/**
	 * @return DataObject
	 */
	public function getRecord() {
		return $this->record;
	}

	/**
	 * @return Member
	 */
	public function getMember() {
		return $this->member;
	}

	/**
	 * @param array $output
	 * @return SS_HTTPResponse
	 */
	protected function getAPIResponse($output) {
		$response = $this->getResponse();
		if($this->respondWithText()) {
			$body = print_r($output, true);
			$response->addHeader('Content-Type', 'text/plain');
		} else {
			$body = Convert::raw2json($output);
			$response->addHeader('Content-Type', 'application/json');
		}
		$response->setBody($body);
		return $response;
	}

	/**
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
	 * @return boolean
	 */
	protected function respondWithText() {
		if($this->getRequest()->getExtension() == 'txt') {
			return true;
		}
		if(strpos($this->getRequest()->getHeader('Accept'), 'text/plain') !== false) {
			return true;
		}
		return false;
	}

	/**
	 * @return array|null
	 */
	protected function getRequestBody() {
		return Convert::json2array($this->getRequest()->getBody());
	}

	/**
	 * Return a simple response with a message
	 *
	 * @param string $message
	 * @param int $statusCode
	 * @return SS_HTTPResponse
	 */
	protected function message($message, $statusCode) {
		$response = $this->getAPIResponse(array(
			'message' => $message,
			'statusCode' => $statusCode
		));
		$response->setStatusCode($statusCode);
		return $response;
	}
}
