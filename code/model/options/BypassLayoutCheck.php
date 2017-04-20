<?php
class BypassLayoutCheck implements DeployOption {

	protected $name = 'bypass_check';

	protected $title = 'Bypass the Layout/Manifest check';

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
