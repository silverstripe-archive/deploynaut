<?php

/**
 * DNEnvironment
 *
 * This dataobject represents a target environment that source code can be
 * deployed to.
 *
 */
class DNEnvironment extends DataObject {

	/**
	 *
	 * @var array
	 */
	public static $db = array(
		"Filename" => "Varchar(255)",
		"Name" => "Varchar",
		"URL" => "Varchar",
		"GraphiteServers" => "Text",
	);

	/**
	 *
	 * @var array
	 */
	public static $has_one = array(
		"Project" => "DNProject",
	);

	/**
	 *
	 * @var array
	 */
	public static $many_many = array(
		"Deployers" => "Member",
	);

	/**
	 *
	 * @var array
	 */
	public static $summary_fields = array(
		"Name",
		"URL",
		"DeployersList",
	);

	/**
	 *
	 * @var array
	 */
	public static $searchable_fields = array(
		"Name",
	);

	/**
	 *
	 * @var array
	 */
	protected static $relation_cache = array();

	/**
	 *
	 * @param string $callerClass
	 * @param string $filter
	 * @param string $sort
	 * @param string $join
	 * @param string $limit
	 * @param string $containerClass
	 * @return \DNEnvironmentList
	 */
	public static function get($callerClass = null, $filter = "", $sort = "", $join = "", $limit = null,
			$containerClass = 'DataList') {
		return new DNEnvironmentList('DNEnvironment');
	}

	/**
	 *
	 * @param string $path
	 * @return \DNEnvironment
	 */
	public static function create_from_path($path) {
		$e = new DNEnvironment;
		$e->Filename = $path;
		$e->Name = preg_replace('/\.rb$/', '', basename($e->Filename));

		// add each administrator member as a deployer of the new environment
		$adminGroup = Group::get()->filter('Code', 'administrators')->first();
		if($adminGroup && $adminGroup->exists()) {
			foreach($adminGroup->Members() as $member) {
				$e->Deployers()->add($member);
			}
		}
		return $e;
	}

	/**
	 *
	 * @return DNProject
	 */
	public function Project() {
		if(!isset(self::$relation_cache['DNProject.' . $this->ProjectID])) {
			self::$relation_cache['DNProject.' . $this->ProjectID] = $this->getComponent('Project');
		}
		return self::$relation_cache['DNProject.' . $this->ProjectID];
	}

	/**
	 *
	 * @param Member $member
	 * @return boolean
	 */
	public function canView($member = null) {
		return $this->Project()->canView($member);
	}

	/**
	 *
	 * @param Member $member
	 * @return boolean
	 */
	public function canDeploy($member = null) {
		if(!$member) $member = Member::currentUser();

		return (bool)($this->Deployers()->byID($member->ID));
	}

	/**
	 *
	 * @return string
	 */
	public function getDeployersList() {
		return implode(", ", $this->Deployers()->column("FirstName"));
	}

	/**
	 *
	 * @return DNData
	 */
	public function DNData() {
		return Injector::inst()->get('DNData');
	}

	/**
	 *
	 * @return string
	 */
	public function CurrentBuild() {
		$buildInfo = $this->DNData()->Backend()->currentBuild($this->Project()->Name.':'.$this->Name);
		return $buildInfo['buildname'];
	}

	/**
	 * A history of all builds deployed to this environment
	 *
	 * @return ArrayList
	 */
	public function DeployHistory() {
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

	/**
	 *
	 * @return string
	 */
	public function HasMetrics() {
		return trim($this->GraphiteServers) != "";
	}

	/**
	 * All graphs
	 *
	 * @return GraphiteList
	 */
	public function Graphs() {
		if(!$this->HasMetrics()) return null;

		$serverList = preg_split('/\s+/', trim($this->GraphiteServers));

		return new GraphiteList($serverList);
	}

	/**
	 * Graphs, grouped by server
	 *
	 * @return ArrayList
	 */
	public function GraphServers() {
		if(!$this->HasMetrics()) return null;

		$serverList = preg_split('/\s+/', trim($this->GraphiteServers));

		$output = new ArrayList;
		foreach($serverList as $server) {
			// Hardcoded reference to db
			if(strpos($server,'nzaadb') !== false) {
				$metricList = array("Load average", "CPU Usage", "Memory Free", "Physical Memory Used", "Swapping");
			} else {
				$metricList = array("Apache", "Load average", "CPU Usage", "Memory Free", "Physical Memory Used", "Swapping");
			}

			$output->push(new ArrayData(array(
				'Server' => $server,
				'ServerName' => substr($server,strrpos($server,'.')+1),
				'Graphs' => new GraphiteList(array($server), $metricList),
			)));
		}

		return $output;
	}

	/**
	 *
	 * @return string
	 */
	public function Link() {
		return $this->Project()->Link()."/environment/" . $this->Name;
	}

	/**
	 *
	 * @return FieldList
	 */
	public function getCMSFields() {
		$fields = parent::getCMSFields();

		$members = array();
		foreach($this->Project()->Viewers() as $group) {
			foreach($group->Members()->map() as $k => $v) {
				$members[$k] = $v;
			}
		}
		asort($members);

		$fields->fieldByName("Root")->removeByName("Deployers");

		$projectField = $fields->fieldByName('Root.Main.ProjectID')->performReadonlyTransformation();

		$fields->insertBefore($projectField, 'Filename');

		$nameField = $fields->fieldByName('Root.Main.Name');
		$nameField->setTitle('Environment name');
		$nameField->setDescription('A descriptive name for this environment, e.g. staging, uat, production');
		$fields->insertAfter($nameField, 'ProjectID');

		$urlField = $fields->fieldByName('Root.Main.URL');
		$urlField->setDescription('This url will be used to provide the front-end with a link to this environment');
		$fields->insertAfter($urlField, 'Name');

		$deployers = new CheckboxSetField("Deployers", "Deployers", $members);
		$deployers->setDescription('Users who can deploy to this environment');
		$fields->insertAfter($deployers, 'URL');

		$fields->makeFieldReadonly('Filename');

		$fields->fieldByName('Root.Main.GraphiteServers')
			->setDescription(
				'Find the relevant graphite servers at '.
				'<a href="http://graphite.silverstripe.com/" target="_blank">graphite.silverstripe.com</a>'.
				' and enter them one per line, e.g. "server.wgtn.oscar"'
			);
		return $fields;
	}
}
