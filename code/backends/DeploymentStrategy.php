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
	protected $actionCode = 'default';

	/**
	 * @var int
	 */
	protected $estimatedTime = 0;

	/**
	 * @var array
	 */
	protected $changes = [];

	/**
	 * @var array
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
	protected $messages = [];


	/**
	 * @param \DNEnvironment $environment
	 * @param array $options
	 */
	public function __construct(\DNEnvironment $environment, $options = array()) {
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
	 * @return int Time in minutes
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
		// Normalise "empty" values into dashes so comparisons are done properly.
		// This means there is no diference between an empty string and a null
		// but "0" is considered to be non-empty.
		if(empty($from) && !strlen($from)) $from = '-';
		if(empty($to) && !strlen($to)) $to = '-';

		return $this->changes[$title] = array(
			'from' => $from,
			'to' => $to
		);
	}

	/**
	 * @param string $title
	 * @param string $desc
	 */
	public function setChangeDescriptionOnly($title, $desc) {
		return $this->changes[$title] = array(
			'description' => $desc
		);
	}

	/**
	 * Filter the changeset where modification was not required.
	 *
	 * @return array
	 */
	public function getChangesModificationNeeded() {
		$filtered = [];
		foreach ($this->changes as $change => $details) {
			if (array_key_exists('description', $details)) {
				$filtered[$change] = $details;
			} else if (
				(array_key_exists('from', $details) || array_key_exists('to', $details))
				&& $details['from'] !== $details['to']
			) {
				$filtered[$change] = $details;
			}
		}

		return $filtered;
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
	 * Returns a change or a given key.
	 *
	 * @return ArrayData|null
	 */
	public function getChange($key) {
		$changes = $this->getChanges();
		if(array_key_exists($key, $changes)) {
			return new ArrayData($changes[$key]);
		}
		return null;
	}

	/**
	 * @param string $option
	 * @param string $value
	 */
	public function setOption($option, $value) {
		$this->options[$option] = $value;
	}

	/**
	 * @param string $option
	 * @return string|null
	 */
	public function getOption($option) {
		if(!empty($this->options[$option])) {
			return $this->options[$option];
		}
	}

	/**
	 * @return string
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
		return $this->validationCode;
	}

	/**
	 * @param string $msg
	 */
	public function setMessage($msg, $code = self::ERROR_CODE) {
		$this->messages[] = [
			'text' => $msg,
			'code' => $code
		];

		$current = $this->getValidationCode();
		$map = [
			DeploymentStrategy::SUCCESS_CODE => 0,
			DeploymentStrategy::WARNING_CODE => 1,
			DeploymentStrategy::ERROR_CODE => 2
		];
		if($map[$current] < $map[$code]) {
			$this->setValidationCode($code);
		}
	}

	/**
	 * @return array
	 */
	public function getMessages() {
		return $this->messages;
	}

	/**
	 * Transform the deployment strategy to an array.
	 *
	 * @return array
	 */
	public function toArray() {
		$fields = array(
			'actionTitle',
			'actionCode',
			'estimatedTime',
			'changes',
			'options',
			'validationCode',
			'messages'
		);

		$output = array();
		foreach($fields as $field) {
			$output[$field] = $this->$field;
		}
		return $output;
	}

	/**
	 * @return string
	 */
	public function toJSON() {
		return json_encode($this->toArray(), JSON_PRETTY_PRINT);
	}

	/**
	 * Load from JSON associative array.
	 * Environment must be set by the callee when creating this object.
	 *
	 * @param string $json
	 */
	public function fromJSON($json) {
		$decoded = json_decode($json, true);
		return $this->fromArray($decoded);
	}

	/**
	 * Load from array.
	 * Environment must be set by the callee when creating this object.
	 *
	 * @param string $data
	 */
	public function fromArray($data) {
		$fields = array(
			'actionTitle',
			'actionCode',
			'estimatedTime',
			'changes',
			'options',
			'validationCode',
			'messages'
		);

		foreach($fields as $field) {
			if(!empty($data[$field])) {
				$this->$field = $data[$field];
			}
		}
	}

	/**
	 * @return DNDeployment
	 */
	public function createDeployment() {
		$deployment = \DNDeployment::create();
		$deployment->EnvironmentID = $this->environment->ID;
		// Pull out the SHA from the options so we can make it queryable.
		$deployment->SHA = $this->getOption('sha');
		$deployment->Branch = $this->getOption('branch');
		// is a branch, tag, uat->prod, prev deploy or sha
		$deployment->RefType = $this->getOption('ref_type');
		$deployment->Summary = $this->getOption('summary');
		$deployment->Title = $this->getOption('title');
		$deployment->Strategy = $this->toJSON();
		$deployment->DeployerID = \Member::currentUserID();
		$deployment->write();

		// re-get and return the deployment so we have the correct state
		return \DNDeployment::get()->byId($deployment->ID);
	}

}

