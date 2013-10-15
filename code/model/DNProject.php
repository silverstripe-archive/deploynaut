<?php
/**
 * DNProject represents a project that relates to a group of target
 * environments.
 *
 */
class DNProject extends DataObject {

	/**
	 *
	 * @var array
	 */
	public static $db = array(
		"Name" => "Varchar",
		"CVSPath" => "Varchar(255)",
		"LocalCVSPath" => "Varchar(255)",
	);

	/**
	 *
	 * @var array
	 */
	public static $has_many = array(
		"Environments" => "DNEnvironment",
		"ReleaseSteps" => "DNReleaseStep",
	);

	/**
	 *
	 * @var array
	 */
	public static $many_many = array(
		"Viewers" => "Group",
	);

	/**
	 *
	 * @var array
	 */
	public static $summary_fields = array(
		"Name",
		"ViewersList",
	);

	/**
	 *
	 * @var array
	 */
	public static $searchable_fields = array(
		"Name",
	);

	/**
	 * Display the repository URL on the project page.
	 *
	 * @var bool
	 */
	private static $show_repository_url = false;

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
	 * @return \DNProjectList
	 */
	public static function get($callerClass = null, $filter = "", $sort = "", $join = "", $limit = null,
			$containerClass = 'DataList') {
		return new DNProjectList('DNProject');
	}

	/**
	 *
	 * @param string $path
	 * @return \DNProject
	 */
	public static function create_from_path($path) {
		$project = new DNProject;
		$project->Name = $path;
		$project->write();

		// add the administrators group as the viewers of the new project
		$adminGroup = Group::get()->filter('Code', 'administrators')->first();
		if($adminGroup && $adminGroup->exists()) {
			$project->Viewers()->add($adminGroup);
		}
		return $project;
	}

	/**
	 *
	 * @param Member $member
	 * @return boolean
	 */
	public function canView($member = null) {
		if(!$member) $member = Member::currentUser();

		if(Permission::checkMember($member, "ADMIN")) return true;

		foreach($this->Viewers() as $group) {
			if($group->Members()->byID($member->ID)) return true;
		}
		return false;
	}

	/**
	 * Build an environment variable array to be used with this project.
	 * Include this with all Gitonomy\Git\Repository, and
	 * \Symfony\Component\Process\Processes.
	 *
	 * @return array
	 */
	public function getProcessEnv() {

		if (file_exists($this->DNData()->getKeyDir()."/$this->Name/$this->Name")) {
			// Key-pair is available, use it.
			return array(
				'IDENT_KEY' => $this->DNData()->getKeyDir()."/$this->Name/$this->Name",
				'GIT_SSH' => BASE_PATH."/git-deploy.sh"
			);
		} else {
			return array();
		}

	}

	/**
	 *
	 * @return string
	 */

	public function getViewersList() {
		return implode(", ", $this->Viewers()->column("Title"));
	}

	/**
	 *
	 * @return DNData
	 */
	public function DNData() {
		return Injector::inst()->get('DNData');
	}

	/**
	 * Provides a DNBuildList of builds found in this project.
	 */
	public function DNBuildList() {
		return new DNReferenceList($this, $this->DNData());
	}

	/**
	 * Provides a list of the branches in this project.
	 */
	public function DNBranchList() {
		if($this->CVSPath && !$this->repoExists()) {
			$this->cloneRepo();
		}
		return new DNBranchList($this, $this->DNData());
	}

	/**
	 * Provides a list of the tags in this project.
	 */
	public function DNTagList() {
		if($this->CVSPath && !$this->repoExists()) {
			$this->cloneRepo();
		}
		return new DNReferenceList($this, $this->DNData(), null, null, true);
	}

	/**
	 * Provides a DNEnvironmentList of environments found in this project.
	 */
	public function DNEnvironmentList() {
		return DNEnvironment::get()->filter('ProjectID', $this->ID)->setProjectID($this->ID);
	}

	/**
	 * Returns a map of envrionment name to build name
	 */
	public function currentBuilds() {
		if(!isset(self::$relation_cache['currentBuilds.'.$this->ID])) {
			$currentBuilds = array();
			foreach($this->Environments() as $env) {
				$currentBuilds[$env->Name] = $env->CurrentBuild();
			}
			self::$relation_cache['currentBuilds.'.$this->ID] = $currentBuilds;
		}
		return self::$relation_cache['currentBuilds.'.$this->ID];
	}

	/**
	 *
	 * @return string
	 */
	public function link() {
		return "naut/project/$this->Name";
	}

	/**
	 *
	 * @return FieldList
	 */
	public function getCMSFields() {
		$fields = parent::getCMSFields();

		$environments = $fields->dataFieldByName("Environments");
		$releaseSteps = $fields->dataFieldByName('ReleaseSteps');

		$fields->fieldByName("Root")->removeByName("Viewers");
		$fields->fieldByName("Root")->removeByName("Environments");
		$fields->fieldByName("Root")->removeByName("ReleaseSteps");

		$nameField = $fields->fieldByName('Root.Main.Name')->performReadonlyTransformation();
		$fields->replaceField('Name', $nameField);

		$cvsField = $fields->fieldByName('Root.Main.LocalCVSPath')->performReadonlyTransformation();
		$fields->replaceField('LocalCVSPath', $cvsField);

		if($environments) {
			$environments->getConfig()->removeComponentsByType('GridFieldAddNewButton');
			$environments->getConfig()->removeComponentsByType('GridFieldAddExistingAutocompleter');
			$environments->getConfig()->removeComponentsByType('GridFieldDeleteAction');
			$environments->getConfig()->removeComponentsByType('GridFieldPageCount');
			$fields->addFieldToTab("Root.Main", $environments);
		}

		if($releaseSteps) {
			$releaseSteps->getConfig()->addComponent(new GridFieldSortableRows('Sort'));
			$releaseSteps->getConfig()->removeComponentsByType('GridFieldAddExistingAutocompleter');
			$releaseSteps->getConfig()->removeComponentsByType('GridFieldAddNewButton');
			$releaseSteps->getConfig()->removeComponentsByType('GridFieldPageCount');
			$addNewRelease = new GridFieldAddNewButton('toolbar-header-right');
			$addNewRelease->setButtonName('Add');
			$releaseSteps->getConfig()->addComponent($addNewRelease);
			$fields->addFieldToTab("Root.Main", $releaseSteps);
		}

		$fields->addFieldToTab("Root.Main",
			new CheckboxSetField("Viewers", "Groups with read access to this project",
				Group::get()->map()));

		return $fields;
	}

	/**
	 *
	 * @return bool
	 */
	public function repoExists() {
		return file_exists(DEPLOYNAUT_LOCAL_VCS_PATH . '/' . $this->Name);
	}

	/**
	 * Setup a resque job to clone a git repository
	 *
	 */
	public function cloneRepo() {
		$this->LocalCVSPath = DEPLOYNAUT_LOCAL_VCS_PATH . '/' . $this->Name;

		Resque::enqueue('git', 'CloneGitRepo', array(
			'repo' => $this->CVSPath,
			'path' => $this->LocalCVSPath,
			'env' => $this->getProcessEnv()
		));
	}

	/**
	 *
	 */
	public function onBeforeWrite() {
		$changedFields = $this->getChangedFields(true, 2);
		if(isset($changedFields['CVSPath']) && $this->CVSPath) {
			$this->LocalCVSPath = DEPLOYNAUT_LOCAL_VCS_PATH . '/' . $this->Name;
			$this->cloneRepo();
		}

		parent::onBeforeWrite();
	}

	/**
	 * Fetch the public key for this project.
	 */
	public function getPublicKey() {
		$keyDir = $this->DNData()->getKeyDir();
		if (file_exists("$keyDir/$this->Name/$this->Name")) {
			return file_get_contents("$keyDir/$this->Name/$this->Name.pub");
		}
	}

	/**
	 * Provide current repository URL to the users.
	 */
	public function getRepositoryURL() {
		$showUrl = Config::inst()->get($this->class, 'show_repository_url');
		if ($showUrl) {
			return $this->CVSPath;
		}
	}
}
