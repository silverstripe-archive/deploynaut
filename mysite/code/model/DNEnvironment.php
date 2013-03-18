<?php

class DNEnvironment extends DataObject {
	static $db = array(
		"Filename" => "Varchar(255)",
		"Name" => "Varchar",
	);
	static $has_one = array(
		"Project" => "DNProject",
	);

	static function get($callerClass = null, $filter = "", $sort = "", $join = "", $limit = null,
			$containerClass = 'DataList') {
		return new DNEnvironmentList('DNEnvironment');
	}

	static function create_from_path($path) {
		$e = new DNEnvironment;
		$e->Filename = $path;
		$e->Name = preg_replace('/\.rb$/', '', basename($e->Filename));
		return $e;
	}

	function DNData() {
		return Injector::inst()->get('DNData');
	}

	function CurrentBuild() {
		$buildInfo = $this->DNData()->Backend()->currentBuild($this->Project()->Name.':'.$this->Name);
		return $buildInfo['buildname'];
	}

	/**
	 * A history of all builds deployed to this environment
	 */
	function DeployHistory() {
		$history = $this->DNData()->Backend()->deployHistory($this->Project()->Name.':'.$this->Name);
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
		return $this->Project()->Link()."/environment/" . $this->Name;
	}
}
