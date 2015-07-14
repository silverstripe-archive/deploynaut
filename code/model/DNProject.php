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
		"DiskQuotaMB" => "Int"
	);

	/**
	 *
	 * @var array
	 */
	public static $has_many = array(
		"Environments" => "DNEnvironment",
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

	private static $singular_name = 'Project';

	private static $plural_name = 'Projects';

	/**
	 *
	 * @var string
	 */
	private static $default_sort = 'Name';

	/**
	 * Display the repository URL on the project page.
	 *
	 * @var bool
	 */
	private static $show_repository_url = false;

	/**
	 * In-memory cache for currentBuilds per environment since fetching them from
	 * disk is pretty resource hungry.
	 *
	 * @var array
	 */
	protected static $relation_cache = array();

	/**
	 * Used by the sync task
	 *
	 * @param string $path
	 * @return \DNProject
	 */
	public static function create_from_path($path) {
		$project = DNProject::create();
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
	 * Return the used quota in MB.
	 *
	 * @param mixed $round Number of decimal places to round to
	 * @return string|int The used quota size in MB
	 */
	public function getUsedQuotaMB($round = 2) {
		$size = 0;

		foreach($this->Environments() as $environment) {
			foreach($environment->DataArchives()->filter('IsBackup', 0) as $archive) {
				$size += $archive->ArchiveFile()->getAbsoluteSize();
			}
		}

		// convert bytes to megabytes and round
		return round(($size / 1024) / 1024, $round);
	}

	/**
	 * Getter for DiskQuotaMB field to provide a default for existing
	 * records that have no quota field set, as it will need to default
	 * to a globally set size.
	 *
	 * @return string|int The quota size in MB
	 */
	public function getDiskQuotaMB() {
		$size = $this->getField('DiskQuotaMB');

		if(empty($size)) {
			$defaults = $this->config()->get('defaults');
			$size = (isset($defaults['DiskQuotaMB'])) ? $defaults['DiskQuotaMB'] : 0;
		}

		return $size;
	}

	/**
	 * Has the disk quota been exceeded?
	 * @return boolean
	 */
	public function HasExceededDiskQuota() {
		return $this->getUsedQuotaMB(0) >= $this->getDiskQuotaMB();
	}

	/**
	 * Is there a disk quota set for this project?
	 * @return boolean
	 */
	public function HasDiskQuota() {
		return $this->getDiskQuotaMB() > 0;
	}

	/**
	 * Get the menu to be shown on projects
	 *
	 * @return ArrayList
	 */
	public function Menu() {
		$list = new ArrayList();

		$list->push(new ArrayData(array(
			'Link' => sprintf('naut/project/%s', $this->Name),
			'Title' => 'Deploy',
			'IsActive' => Controller::curr()->getAction() == 'project'
		)));

		if(DNRoot::FlagSnapshotsEnabled()) {
			$list->push(new ArrayData(array(
				'Link' => sprintf('naut/project/%s/snapshots', $this->Name),
				'Title' => 'Snapshots',
				'IsActive' => Controller::curr()->getAction() == 'snapshots'
			)));
		}

		$this->extend('updateMenu', $list);

		return $list;
	}

	/**
	 * Restrict access to viewing this project
	 *
	 * @param Member $member
	 * @return boolean
	 */
	public function canView($member = null) {
		if(!$member) $member = Member::currentUser();

		if(Permission::checkMember($member, 'ADMIN')) return true;

		return $member->inGroups($this->Viewers());
	}

	public function canRestore($member = null) {
		return (bool)$this->Environments()->filterByCallback(function($env) use($member) {
			return $env->canRestore($member);
		})->Count();
	}

	public function canBackup($member = null) {
		return (bool)$this->Environments()->filterByCallback(function($env) use($member) {
			return $env->canBackup($member);
		})->Count();
	}

	public function canUploadArchive($member = null) {
		return (bool)$this->Environments()->filterByCallback(function($env) use($member) {
			return $env->canUploadArchive($member);
		})->Count();
	}

	public function canDownloadArchive($member = null) {
		return (bool)$this->Environments()->filterByCallback(function($env) use($member) {
			return $env->canDownloadArchive($member);
		})->Count();
	}

	public function DataArchives() {
		$envIds = $this->Environments()->column('ID');
		return DNDataArchive::get()->filter('EnvironmentID', $envIds);
	}

	/**
	 * Return all archives which are "manual upload requests",
	 * meaning they don't have a file attached to them (yet).
	 *
	 * @return ArrayList
	 */
	public function PendingManualUploadDataArchives() {
		return $this->DataArchives()->filter('ArchiveFileID', null);
	}

	/**
	 * Build an environment variable array to be used with this project.
	 *
	 * This is relevant if every project needs to use an individual SSH pubkey.
	 *
	 * Include this with all Gitonomy\Git\Repository, and
	 * \Symfony\Component\Process\Processes.
	 *
	 * @return array
	 */
	public function getProcessEnv() {
		if (file_exists($this->DNData()->getKeyDir()."/$this->Name/$this->Name")) {
			// Key-pair is available, use it.
			$processEnv = array(
				'IDENT_KEY' => $this->DNData()->getKeyDir()."/$this->Name/$this->Name",
				'GIT_SSH' => BASE_PATH . "/deploynaut/git-deploy.sh"
			);
		} else {
			$processEnv = array();
		}
		$this->extend('updateProcessEnv', $processEnv);
		return $processEnv;
	}

	/**
	 * Get a string of people allowed to view this project
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
		return DNData::inst();
	}

	/**
	 * Provides a DNBuildList of builds found in this project.
	 */
	public function DNBuildList() {
		return DNReferenceList::create($this, $this->DNData());
	}

	/**
	 * Provides a list of the branches in this project.
	 */
	public function DNBranchList() {
		if($this->CVSPath && !$this->repoExists()) {
			$this->cloneRepo();
		}
		return DNBranchList::create($this, $this->DNData());
	}

	/**
	 * Provides a list of the tags in this project.
	 */
	public function DNTagList() {
		if($this->CVSPath && !$this->repoExists()) {
			$this->cloneRepo();
		}
		return DNReferenceList::create($this, $this->DNData(), null, null, true);
	}

	/**
	 *
	 * @return Gitonomy\Git\Repository
	 */
	public function getRepository() {
		if(!$this->repoExists()) {
			return false;
		}
		return new Gitonomy\Git\Repository($this->LocalCVSPath);
	}

	/**
	 * Provides a list of environments found in this project.
	 * CAUTION: filterByCallback will change this into an ArrayList!
	 *
	 * @return ArrayList
	 */
	public function DNEnvironmentList() {
		return $this->Environments()
			->filterByCallBack(function($item) {
				return $item->canView();
			});
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
	public function Link($action='') {
		return Controller::join_links("naut", "project", $this->Name, $action);
	}

	/**
	 *
	 * @param string $action
	 * @return string
	 */
	public function APILink($action) {
		return Controller::join_links("naut", "api", $this->Name, $action);
	}

	/**
	 *
	 * @return FieldList
	 */
	public function getCMSFields() {
		$fields = parent::getCMSFields();

		$environments = $fields->dataFieldByName("Environments");

		$fields->fieldByName("Root")->removeByName("Viewers");
		$fields->fieldByName("Root")->removeByName("Environments");
		$fields->fieldByName("Root")->removeByName("LocalCVSPath");

		$fields->dataFieldByName('DiskQuotaMB')->setDescription('This is the maximum amount of disk space (in megabytes) that all environments within this project can use for stored snapshots');

		$fields->fieldByName('Root.Main.Name')
			->setTitle('Project name')
			->setDescription('Changing the name will <strong>reset</strong> the deploy configuration and avoid using non alphanumeric characters');

		$fields->fieldByName('Root.Main.CVSPath')
			->setTitle('Git repository')
			->setDescription('E.g. git@github.com:silverstripe/silverstripe-installer.git');

		$workspaceField = new ReadonlyField('LocalWorkspace', 'Git workspace', $this->getLocalCVSPath());
		$workspaceField->setDescription('This is where the GIT repository are located on this server');
		$fields->insertAfter($workspaceField, 'CVSPath');

		$readAccessGroups = ListboxField::create('Viewers', 'Project viewers', Group::get()->map()->toArray())
			->setMultiple(true)
			->setDescription('These groups can view the project in the front-end.');
		$fields->addFieldToTab("Root.Main", $readAccessGroups);

		$this->setCreateProjectFolderField($fields);
		$this->setEnvironmentFields($fields, $environments);

		return $fields;
	}

	/**
	 * If there isn't a capistrano env project folder, show options to create one
	 *
	 * @param FieldList $fields
	 */
	public function setCreateProjectFolderField(&$fields) {
		// Check if the capistrano project folder exists
		if(!$this->Name) {
			return;
		}

		if($this->projectFolderExists()) {
			return;
		}

		$createFolderNotice = new LabelField('CreateEnvFolderNotice', 'Warning: No Capistrano project folder exists');
		$createFolderNotice->addExtraClass('message warning');
		$fields->insertBefore($createFolderNotice, 'Name');
		$createFolderField = new CheckboxField('CreateEnvFolder', 'Create folder');
		$createFolderField->setDescription('Would you like to create the capistrano project folder?');
		$fields->insertAfter($createFolderField, 'CreateEnvFolderNotice');
	}

	/**
	 *
	 * @return boolean
	 */
	public function projectFolderExists() {
		if(file_exists($this->DNData()->getEnvironmentDir().'/'.$this->Name)){
			return true;
		}
		return false;
	}

	/**
	 *
	 * @return bool
	 */
	public function repoExists() {
		return file_exists(DEPLOYNAUT_LOCAL_VCS_PATH . '/' . $this->Name.'/HEAD');
	}

	/**
	 * Setup a asyncronous resque job to clone a git repository
	 *
	 */
	public function cloneRepo() {
		Resque::enqueue('git', 'CloneGitRepo', array(
			'repo' => $this->CVSPath,
			'path' => $this->getLocalCVSPath(),
			'env' => $this->getProcessEnv()
		));
	}

	/**
	 *
	 * @return string
	 */
	public function getLocalCVSPath() {
		return DEPLOYNAUT_LOCAL_VCS_PATH . '/' . $this->Name;
	}

	/**
	 * Checks for missing folders folder and schedules a git clone if the necessary
	 *
	 */
	public function onBeforeWrite() {
		parent::onBeforeWrite();

		$this->checkProjectPath();
		$this->checkCVSPath();
	}

	/**
	 * Ensure the path for this project has been created
	 */
	protected function checkProjectPath() {
		// Create the project capistrano folder
		if($this->CreateEnvFolder && !file_exists($this->getProjectFolderPath())) {
			mkdir($this->DNData()->getEnvironmentDir().'/'.$this->Name);
		}
	}

	/**
	 * Check if the CVSPath has been changed, and if so, ensure the repository has been updated
	 */
	protected function checkCVSPath() {
		$changedFields = $this->getChangedFields(true, 2);
		if (!$this->CVSPath) {
			return;
		}
		if (isset($changedFields['CVSPath']) || isset($changedFields['Name'])) {
			$this->cloneRepo();
		}
	}

	/**
	 * Delete related environments and folders
	 */
	public function onAfterDelete() {
		parent::onAfterDelete();

		// Delete related environments
		foreach($this->Environments() as $env) {
			$env->delete();
		}

		if(!file_exists($this->getProjectFolderPath())) {
			return;
		}
		// Create a basic new environment config from a template
		if(Config::inst()->get('DNEnvironment', 'allow_web_editing')) {
			FileSystem::removeFolder($this->getProjectFolderPath());
		}
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
	 * Setup a gridfield for the environment configs
	 *
	 * @param FieldList $fields
	 * @param $environments
	 * @return void
	 */
	protected function setEnvironmentFields(&$fields, $environments) {
		if(!$environments) {
			return;
		}

		$environments->getConfig()->addComponent(new GridFieldAddNewMultiClass());
		$environments->getConfig()->removeComponentsByType('GridFieldAddNewButton');
		$environments->getConfig()->removeComponentsByType('GridFieldAddExistingAutocompleter');
		$environments->getConfig()->removeComponentsByType('GridFieldDeleteAction');
		$environments->getConfig()->removeComponentsByType('GridFieldPageCount');
		if(Config::inst()->get('DNEnvironment', 'allow_web_editing')) {
			$addNewRelease = new GridFieldAddNewButton('toolbar-header-right');
			$addNewRelease->setButtonName('Add');
			$environments->getConfig()->addComponent($addNewRelease);
		}

		$fields->addFieldToTab("Root.Main", $environments);
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

	/**
	 *
	 * @return string
	 */
	protected function getProjectFolderPath() {
		return $this->DNData()->getEnvironmentDir().'/'.$this->Name;
	}
}
