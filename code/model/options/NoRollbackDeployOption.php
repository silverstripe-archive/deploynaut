<?php
class NoRollbackDeployOption implements DeployOption {

	protected $defaultValue;

	public function __construct($defaultValue = false) {
		$this->defaultValue = $defaultValue;
	}

	public function getName() {
		return 'no_rollback';
	}

	public function getTitle() {
		return 'No rollback on deploy failure';
	}

	public function getDefaultValue() {
		return $this->defaultValue;
	}

}
