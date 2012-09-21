<?php

class DNEnvironment extends ViewableData {
	protected $data;
	protected $filename;
	protected $name;
	protected $project;
	
	function __construct($filename, $project, DNData $data) {
		$this->data = $data;
		$this->filename = $filename;
		$this->name = preg_replace('/\.rb$/', '', basename($this->filename));
		$this->project = $project;
	}
	
	function Name() {
		return $this->name;
	}

	function getProject() {
		return $this->project;
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
		return "naut/project/".$this->project->getName()."/environment/" . $this->name;
	}
}
