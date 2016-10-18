<?php
class NoRollbackDeployOption implements DeployOption {

	protected $name = 'no_rollback';

	protected $title = 'No rollback on deploy failure';

	protected $defaultValue;

	public function __construct($defaultValue = false) {
		$this->defaultValue = $defaultValue;
	}

	public function __get($name) {
		if (method_exists($this, 'get' . $name)) {
			return $this->{'get' . $name}();
		}
		return $this->$name;
	}

	public function getName() {
		return $this->name;
	}

	public function getTitle() {
		return $this->title;
	}

	public function getDefaultValue() {
		return $this->defaultValue;
	}

}
