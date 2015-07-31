<?php

class GitSHA extends Varchar {

	function __construct($name = null, $options = array()) {
		parent::__construct($name, 255, $options); // Size should probably be 40, but to avoid schema change leave for now
	}

	function FullHash() {
		return $this->value;
	}

	function ShortHash() {
		return substr($this->value, 0, 7);
	}
}