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
	 * If this is set to a full pathfile, it will be used as template
	 * file when creating a new capistrano environment config file.
	 * 
	 * If not set, the default 'environment.template' from the module 
	 * root is used
	 *
	 * @var string
	 */
	private static $template_file = '';
	
	/**
	 * Set this to true to allow editing of the environment files via the web admin
	 *
	 * @var bool
	 */
	private static $allow_web_editing = false;
	
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
	 * @var string 
	 */
	private static $default_sort = 'Name';

	/**
	 * Caches the relation to the Parent Project
	 *
	 * @var array
	 */
	protected static $relation_cache = array();

	/**
	 * 
	 * @todo this should probably be refactored so it don't interfere with the default
	 * DataObject::get() behaviour.
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
	 * Used by the sync task
	 *
	 * @param string $path
	 * @return \DNEnvironment
	 */
	public static function create_from_path($path) {
		$e = new DNEnvironment;
		$e->Filename = $path;
		$e->Name = basename($e->Filename, '.rb');

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
	 * Environments are only viewable by people that can view the parent project
	 *
	 * @param Member $member
	 * @return boolean
	 */
	public function canView($member = null) {
		return $this->Project()->canView($member);
	}

	/**
	 * Allow deploy only to some people.
	 *
	 * @param Member $member
	 * @return boolean
	 */
	public function canDeploy($member = null) {
		if(!$member) $member = Member::currentUser();

		return (bool)($this->Deployers()->byID($member->ID));
	}

	/**
	 * Get a string of people that are allowed to deploy to this environment
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
	 * Get the current deployed build for this environment
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
	 * Does this environment have a graphite server configuration
	 *
	 * @return string
	 */
	public function HasMetrics() {
		return trim($this->GraphiteServers) != "";
	}

	/**
	 * All graphite graphs
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
	 * @todo refactor out the hardcoded aa exception
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

		// The Main.ProjectID
		$projectField = $fields->fieldByName('Root.Main.ProjectID')->performReadonlyTransformation();
		$fields->insertBefore($projectField, 'Name');
		
		// The Main.Name
		$nameField = $fields->fieldByName('Root.Main.Name');
		$nameField->setTitle('Environment name');
		$nameField->setDescription('A descriptive name for this environment, e.g. staging, uat, production');
		$fields->insertAfter($nameField, 'ProjectID');

		// The Main.Filename
		$fileNameField = $fields->fieldByName('Root.Main.Filename')->performReadonlyTransformation();
		$fileNameField->setTitle('Filename');
		$fileNameField->setDescription('The capistrano environment file name');
		$fields->insertAfter($fileNameField, 'Name');
		
		// The Main.Deployers
		$deployers = new CheckboxSetField("Deployers", "Deployers", $members);
		$deployers->setDescription('Users who can deploy to this environment');
		$fields->insertAfter($deployers, 'URL');

		// The Main.DeployConfig
		if($this->Project()->exists()) {
			$this->setDeployConfigurationFields($fields);
		}
		
		// The Extra.URL field
		$urlField = $fields->fieldByName('Root.Main.URL');
		$urlField->setTitle('Server URL');
		$fields->removeByName('Root.Main.URL');
		$urlField->setDescription('This url will be used to provide the front-end with a link to this environment');
		$fields->addFieldToTab('Root.Extra', $urlField);
		
		// The Extra.GraphiteServers
		$graphiteServerField = $fields->fieldByName('Root.Main.GraphiteServers');
		$fields->removeByName('Root.Main.GraphiteServers');
		$graphiteServerField->setDescription(
			'Find the relevant graphite servers at '.
			'<a href="http://graphite.silverstripe.com/" target="_blank">graphite.silverstripe.com</a>'.
			' and enter them one per line, e.g. "server.wgtn.oscar"'
		);
		$fields->addFieldToTab('Root.Extra', $graphiteServerField);
		
		Requirements::javascript('deploynaut/javascript/environment.js');
		
		// Add actions
		$action = new FormAction('check', 'Check Connection');
		$action->setUseButtonTag(true);
		$action->setAttribute('data-url', Director::absoluteBaseURL().'naut/api/'.$this->Project()->Name.'/'.$this->Name.'/ping');
		$fields->insertBefore($action, 'Name');
		return $fields;
	}
	
	/**
	 * 
	 * @param FieldList $fields
	 */
	protected function setDeployConfigurationFields(&$fields) {
		if(!$this->config()->get('allow_web_editing')) {
			return;
		}
		
		if($this->envFileExists()) {
			$deployConfig = new TextareaField('DeployConfig', 'Deploy config', $this->getEnvironmentConfig());
			$deployConfig->setRows(40);
			$fields->insertAfter($deployConfig, 'Deployers');
			return;
		}
			
		$noDeployConfig = new LabelField('noDeployConfig', 'Warning: This environment don\'t have deployment configuration.');
		$noDeployConfig->addExtraClass('message warning');
		$fields->insertAfter($noDeployConfig, 'Filename');
		$createConfigField = new CheckboxField('CreateEnvConfig', 'Create Config');
		$createConfigField->setDescription('Would you like to create the capistrano deploy configuration?');
		$fields->insertAfter($createConfigField, 'noDeployConfig');
	}
	
	/**
	 * 
	 */
	public function onBeforeWrite() {
		parent::onBeforeWrite();
		if($this->Name && $this->Name.'.rb' != $this->Filename) {
			$this->Filename = $this->Name.'.rb';
		}
		
		// Create a basic new environment config from a template
		if($this->config()->get('allow_web_editing') && !$this->envFileExists() && $this->Filename && $this->CreateEnvConfig) {
			if(self::$template_file) {
				$templateFile = self::$template_file;
			} else {
				$templateFile = BASE_PATH.'/deploynaut/environment.template';
			}
			file_put_contents($this->getConfigFilename(), file_get_contents($templateFile));
		} else if($this->config()->get('allow_web_editing') && $this->envFileExists() && $this->DeployConfig) {
			file_put_contents($this->getConfigFilename(), $this->DeployConfig);
		}
	}
	
	/**
	 * Delete any related config files
	 */
	public function onAfterDelete() {
		parent::onAfterDelete();
		// Create a basic new environment config from a template
		if($this->config()->get('allow_web_editing') && $this->envFileExists()) {
			unlink($this->getConfigFilename());
		}
	}
	
	/**
	 * 
	 * @return string
	 */
	protected function getEnvironmentConfig() {
		if(!$this->envFileExists()) {
			return '';
		}
		return file_get_contents($this->getConfigFilename());
	}
	
	/**
	 * 
	 * @return boolean
	 */
	protected function envFileExists() {
		if(!$this->getConfigFilename()) {
			return false;
		}
		return file_exists($this->getConfigFilename());
	}
	
	/**
	 * 
	 * @return boolean
	 */
	public function getConfigFilename() {
		if(!$this->Project()->exists()) {
			return '';
		}
		if(!$this->Filename) {
			return '';
		}
		return $this->DNData()->getEnvironmentDir().'/'.$this->Project()->Name.'/'.$this->Filename;
	}
}
