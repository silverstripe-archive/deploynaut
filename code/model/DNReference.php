<?php

class DNReference extends ViewableData {

	/**
	 *
	 * @var Gitonomy\Git\Reference
	 */
	protected $reference;

	public function __construct(Gitonomy\Git\Reference $reference) {
		$this->reference = $reference;
	}

	public function Name() {
		return htmlentities($this->reference->getName());
	}

	public function FullName() {
		return htmlentities($this->reference->getCommitHash());
	}

	public function Filename() {
		return htmlentities($this->reference->getFullname());
	}

}
