<?php

class GitSHA extends Varchar {

	/**
	 * @param string|null $name
	 * @param array $options
	 */
	public function __construct($name = null, $options = array()) {
		// Size should probably be 40, but to avoid schema change leave for now
		parent::__construct($name, 255, $options);
	}

	/**
	 * @return string
	 */
	public function FullHash() {
		return $this->value;
	}

	/**
	 * @return string
	 */
	public function ShortHash() {
		return substr($this->value, 0, 7);
	}
}
