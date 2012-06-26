<?php

class DNEnvironmentList extends ArrayList {

	/**
	 *
	 * @var DNData 
	 */
	protected $data;
	
	/**
	 *
	 * @var array of DNEnvironment
	 */
	protected $environments;

	/**
	 *
	 * @param string $environmentNames
	 * @param DNData $data 
	 */
	public function __construct($environmentNames, DNData $data) {
		$this->data = $data;

		$this->environments = array();
		foreach($environmentNames as $name) {
			$this->environments[$name] = new DNEnvironment($name, $this->data);
		}
		
		parent::__construct(array_values($this->environments));
	}
	
	/**
	 *
	 * @param string $name
	 * @return string 
	 */
	public function byName($name) {
		if(isset($this->environments[$name])) {
			return $this->environments[$name];
		}
		return 'unknown';
	}
}