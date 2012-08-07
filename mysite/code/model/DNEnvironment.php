<?php

class DNEnvironment extends ViewableData {
	protected $data, $name;
	
	function __construct($name, DNData $data) {
		$this->data = $data;
		$this->name = $name;
	}
	
	function Name() {
		return $this->name;
	}
	
	function CurrentBuild() {
		$buildInfo = $this->data->Backend()->currentBuild($this->name);
		return $buildInfo['buildname'];
	}
	
	/**
	 * A history of all builds deployed to this environment
	 */
	function DeployHistory() {
		$history = $this->data->Backend()->deployHistory($this->name);
		$output = new ArrayList;
		foreach($history as $item) {
			$output->push(new ArrayData(array(
				'BuildName' => $item['buildname'],
				'DateTime' => DBField::create_field('SS_Datetime', $item['datetime']),
			)));
		}
		return $output;
	}
	
	function Link() {
		return "naut/environment/" . $this->name;
	}
}
