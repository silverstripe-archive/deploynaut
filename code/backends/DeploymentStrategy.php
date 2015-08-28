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
	 * @param array $options
	 */
	public function __construct(DNEnvironment $environment, $options = array()) {
		$this->environment = $environment;
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
	 * @return mixed
	 */
	public function getOption($option) {
		if (!empty($this->options[$option])) {
			return $this->options[$option];
		}
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

	/**
	 * @return string
	 */
	public function toJSON() {
		$fields = array(
			'actionTitle',
			'actionCode',
			'estimatedTime',
			'changes',
			'options',
			'validationCode',
			'errors'
		);

		$output = array();
		foreach ($fields as $field) {
			$output[$field] = $this->$field;
		}
		return json_encode($output, JSON_PRETTY_PRINT);
	}

	/**
	 * Load from JSON associative array.
	 * Environment must be set by the callee when creating this object.
	 *
	 * @param string $json
	 */
	public function fromJSON($json) {
		$fields = array(
			'actionTitle',
			'actionCode',
			'estimatedTime',
			'changes',
			'options',
			'validationCode',
			'errors'
		);
		$decoded = json_decode($json, true);

		foreach ($fields as $field) {
			if (!empty($decoded[$field])) {
				$this->$field = $decoded[$field];
			}
		}
	}

	/**
	 * @return DNDeployment
	 */
	public function createDeployment() {
		$deployment = DNDeployment::create();
		$deployment->EnvironmentID = $this->environment->ID;
		// Pull out the SHA from the options so we can make it queryable.
		$deployment->SHA = $this->getOption('sha');
		$deployment->Strategy = $this->toJSON();
		$deployment->write();

		return $deployment;
	}

}

