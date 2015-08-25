<?php

class DeploymentStrategy extends ViewableData {

	const SUCCESS_CODE = 'success';

	const WARNING_CODE = 'warning';

	const ERROR_CODE = 'error';

	/**
	 * @var DNEnvironment
	 */
	protected $environment;

	/**
	 * @var string
	 */
	protected $sha;

	/**
	 * @var string
	 */
	protected $actionTitle = 'Deploy';

	/**
	 * @var string
	 */
	protected $actionCode = 'deploy';

	/**
	 * @var int 
	 */
	protected $estimatedTime = 0;

	/**
	 * @var string
	 */
	protected $changes;

	/**
	 * @var string
	 */
	protected $options;

	/**
	 * Validation code
	 *
	 * @var string
	 */
	protected $validationCode = DeploymentStrategy::SUCCESS_CODE;

	/**
	 * @var array
	 */
	protected $errors = array();


	/**
	 * @param DNEnvironment $environment
	 * @param string $sha
	 * @param array $options
	 */
	public function __construct(DNEnvironment $environment, $sha, $options = array()) {
		$this->environment = $environment;
		$this->sha = $sha;
		$this->options = $options;
	}

	/**
	 * @param string $title
	 */
	public function setActionTitle($title) {
		$this->actionTitle = $title;
	}

	/**
	 * @return string
	 */
	public function getActionTitle() {
		return $this->actionTitle;
	}

	/**
	 * @param string $title
	 */
	public function setActionCode($code) {
		$this->actionCode = $code;
	}

	/**
	 * @return string
	 */
	public function getActionCode() {
		return $this->actionCode;
	}

	/**
	 * @param int
	 */
	public function setEstimatedTime($seconds) {
		$this->estimatedTime = $seconds;
	}

	/**
	 * @return int Time in seconds
	 */
	public function getEstimatedTime() {
		return $this->estimatedTime;
	}

	/**
	 * @param string $title
	 * @param string $from
	 * @param string $to
	 */
	public function setChange($title, $from, $to) {
		return $this->changes[$title] = array(
			'from' => $from,
			'to' => $to
		);
	}

	/**
	 * @return array Associative array of changes, e.g.
	 *	array(
	 *		'SHA' => array(
	 *			'from' => 'abc',
	 *			'to' => 'def'
	 *		)
	 *	)
	 */
	public function getChanges() {
		return $this->changes;
	}

	/**
	 * @param string $option
	 * @param string $value
	 */
	public function setOption($option, $value) {
		$this->options[$option] = $value;
	}

	/**
	 * @return array
	 */
	public function getOptions() {
		return $this->options;
	}

	/**
	 * @param string $code
	 */
	public function setValidationCode($code) {
		$this->validationCode = $code;
	}

	/**
	 * @return string
	 */
	public function getValidationCode() {
		return $this->validatonCode;
	}

	/**
	 * @param string $msg
	 */
	public function setError($msg) {
		$this->errors[] = $msg;
		$this->setValidationCode(DeploymentStrategy::ERROR_CODE);
	}

	/**
	 * @return array
	 */
	public function getErrors() {
		return $this->errors;
	}
}

