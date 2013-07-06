<?php
/**
 * DNProject represents a project that relates to a group of target
 * environments, and a has access to specific build tarballs.
 *
 * For the project to be able to pick up builds, the tarballs need to 
 * be stored in similarly named directories, e.g.:
 * deploynaut-resources/envs/ss3/dev.rb
 * deploynaut-resources/builds/ss3/ss3-1.0.3.tar.gz
 */

class DNProject extends DataObject {
	static $db = array(
		"Name" => "Varchar",
		"CVSPath" => "Varchar(255)",
		"LocalCVSPath" => "Varchar(255)",
	);
	static $has_many = array(
		"Environments" => "DNEnvironment",
	);
	static $many_many = array(
		"Viewers" => "Group",
	);

	static $summary_fields = array(
		"Name",
		"ViewersList",
	);
	static $searchable_fields = array(
		"Name",
	);

	/**
	 * Display the repository URL on the project page.
	 */
	private static $show_repository_url = false;

	protected static $relation_cache = array();

	static function get($callerClass = null, $filter = "", $sort = "", $join = "", $limit = null,
			$containerClass = 'DataList') {
		return new DNProjectList('DNProject');
	}

	static function create_from_path($path) {
		$p = new DNProject;
		$p->Name = $path;
		$p->write();

		// add the administrators group as the viewers of the new project
		$adminGroup = Group::get()->filter('Code', 'administrators')->first();
		if($adminGroup && $adminGroup->exists()) {
			$p->Viewers()->add($adminGroup);
		}

		return $p;
	}

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
	 * Include this with all Gitonomy\Git\Repository, and \Symfony\Component\Process\Processes.
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

	function getViewersList() {
		return implode(", ", $this->Viewers()->column("Title"));
	}

	function DNData() {
		return Injector::inst()->get('DNData');
	}

	/**
	 * Provides a DNBuildList of builds found in this project.
	 */
	function DNBuildList() {
		return new DNReferenceList($this, $this->DNData());
	}

	/**
	 * Provides a list of the branches in this project.
	 */
	function DNBranchList() {
		// if we need to, clone the repository if it doesn't exist
		// this doesn't use resque, though
		if(!$this->repoExists() && $this->CVSPath) {
			try {
				Gitonomy\Git\Admin::cloneTo(DEPLOYNAUT_LOCAL_VCS_PATH . '/' . $this->Name, $this->CVSPath);
			} catch (Exception $e) {
				// if we can't clone the repo, log the error, but don't block execution
				SS_Log::log($e, SS_Log::ERR);
			}
		}
		return new DNBranchList($this, $this->DNData());
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



	public function Link() {
		return "naut/project/$this->Name";
	}

	public function getCMSFields() {
		$fields = parent::getCMSFields();

		$environments = $fields->dataFieldByName("Environments");

		$fields->fieldByName("Root")->removeByName("Viewers");
		$fields->fieldByName("Root")->removeByName("Environments");

		$nameField = $fields->fieldByName('Root.Main.Name')->performReadonlyTransformation();
		$fields->replaceField('Name', $nameField);


		$cvsField = $fields->fieldByName('Root.Main.LocalCVSPath')->performReadonlyTransformation();
		$fields->replaceField('LocalCVSPath', $cvsField);

		if($environments) {
			$environments->getConfig()->removeComponentsByType('GridFieldAddNewButton');
			$environments->getConfig()->removeComponentsByType('GridFieldAddExistingAutocompleter');
			$environments->getConfig()->removeComponentsByType('GridFieldDeleteAction');
			$fields->addFieldToTab("Root.Main", $environments);
		}
		$fields->addFieldToTab("Root.Main",
			new CheckboxSetField("Viewers", "Groups with read access to this project",
				Group::get()->map()));

		return $fields;
	}

	public function repoExists() {
		return file_exists(DEPLOYNAUT_LOCAL_VCS_PATH . '/' . $this->Name);
	}

	public function updateRepo() {
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
			$this->updateRepo();
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
