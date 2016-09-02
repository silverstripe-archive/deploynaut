<?php
class PredeployBackupOption implements DeployOption {

	protected $defaultValue;

	public function __construct($defaultValue = false) {
		$this->defaultValue = $defaultValue;
	}

	public function getName() {
		return 'predeploy_backup';
	}

	public function getTitle() {
		return 'Backup database before deploying';
	}

	public function getDefaultValue() {
		return $this->defaultValue;
	}

}
