<?php

class DNReference extends ViewableData {

	/**
	 * @var Gitonomy\Git\Reference
	 */
	protected $reference;

	private static $casting = array(
		'Name' => 'Text',
		'FullName' => 'Text',
		'Filename' => 'Text'
	);

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
		return $this->reference->getFullname();
	}

}
