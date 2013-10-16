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
		return $this->reference->getName();
	}

	public function FullName() {
		return $this->reference->getCommitHash();
	}

	public function Filename() {
		return$this->reference->getFullname();
	}

}
