<?php

class DNBuild extends ViewableData {
	protected $filename;
	protected $buildname;
	protected $simplename;
	
	protected $data;
	
	function __construct($filename, DNData $data) {
		$this->data = $data;
		
		$this->filename = $filename;
		$this->buildname = preg_replace('/\.tar\.gz$/', '', basename($this->filename));
		$this->simplename = preg_replace('/^[^-]+-/', '', $this->buildname);
		
		parent::__construct();
	}

	function Link() {
		return "naut/build/" . $this->name;
	}
	
	function FullName() {
		return $this->buildname;
	}
	
	function Name() {
		return $this->simplename;
	}
	
	function Filename() {
		return $this->filename;
	}
	
	function Created() {
		$d = new SS_Datetime();
		$d->setValue(date('Y-m-d H:i:s', filemtime($this->filename)));
		return $d;
	}
	
	function CurrentlyDeployedTo() {
		$output = new ArrayList;
		foreach($this->data->DNEnvironmentList() as $environment) {
			if($environment->CurrentBuild() == $this->buildname) $output->push($environment);
		}
		return $output;
	}

	function EverDeployedTo($environmentName) {
		$environment = $this->data->DNEnvironmentList()->byName($environmentName);
		
	}
}