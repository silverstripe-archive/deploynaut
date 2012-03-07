<?php

class DNEnvironmentList extends ArrayList {

	protected $data;
	protected $environments;

	function __construct($environmentNames, DNData $data) {
		$this->data = $data;

		$this->environments = array();
		foreach($environmentNames as $name) {
			$this->environments[$name] = new DNEnvironment($name, $this->data);
		}
		
		parent::__construct(array_values($this->environments));
	}
	
	function byName($name) {
		return $this->environments[$name];
	}
	
}