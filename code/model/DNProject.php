<?php

/**
 * DNProject represents a project that relates to a group of target
 * environments.
 *
 * @property string Name
 * @property string CVSPath
 * @property int DiskQuotaMB
 *
 * @method HasManyList Environments()
 * @method ManyManyList Viewers()
 */
class DNProject extends DataObject {

	/**
	 * @var array
	 */
	public static $db = array(
		"Name" => "Varchar",
		"CVSPath" => "Varchar(255)",
		"DiskQuotaMB" => "Int"
	);

	/**
	 * @var array
	 */
	public static $has_many = array(
		"Environments" => "DNEnvironment",
	);

	/**
	 * @var array
	 */
	public static $many_many = array(
		"Viewers" => "Group",
		'StarredBy' => "Member"
	);

	/**
	 * @var array
	 */
	public static $summary_fields = array(
		"Name",
		"ViewersList",
	);

	/**
	 * @var array
	 */
	public static $searchable_fields = array(
		"Name",
	);

	private static $singular_name = 'Project';

	private static $plural_name = 'Projects';

	/**
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
	 * @var bool|Member
	 */
	protected static $_current_member_cache = null;

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
	 * @param integer $round Number of decimal places to round to
	 * @return double The used quota size in MB
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
	 * Returns the current disk quota usage as a percentage
	 *
	 * @return int
	 */
	public function DiskQuotaUsagePercent() {
		$quota = $this->getDiskQuotaMB();
		if($quota > 0) {
			return $this->getUsedQuotaMB() * 100 / $quota;
		}
		return 100;
	}

	/**
	 * Get the menu to be shown on projects
	 *
	 * @return ArrayList
	 */
	public function Menu() {
		$list = new ArrayList();

		$controller = Controller::curr();
		$actionType = $controller->getField('CurrentActionType');

		$list->push(new ArrayData(array(
			'Link' => sprintf('naut/project/%s', $this->Name),
			'Title' => 'Deployments',
			'IsCurrent' => $this->isCurrent(),
			'IsSection' => $this->isSection() && $actionType == DNRoot::ACTION_DEPLOY
		)));

		if(DNRoot::FlagSnapshotsEnabled()) {
			$list->push(new ArrayData(array(
				'Link' => sprintf('naut/project/%s/snapshots', $this->Name),
				'Title' => 'Snapshots',
				'IsCurrent' => $this->isSection() && $controller->getAction() == 'snapshots',
				'IsSection' => $this->isSection() && $actionType == DNRoot::ACTION_SNAPSHOT
			)));
		}

		$this->extend('updateMenu', $list);

		return $list;
	}

	/**
	 * Is this project currently at the root level of the controller that handles it?
	 * @return bool
	 */
	public function isCurrent() {
		return $this->isSection() && Controller::curr()->getAction() == 'project';
	}

	/**
	 * Return the current object from $this->Menu()
	 * Good for making titles and things
	 */
	public function CurrentMenu() {
		return $this->Menu()->filter('IsSection', true)->First();
	}

	/**
	 * Is this project currently in a controller that is handling it or performing a sub-task?
	 * @return bool
	 */
	public function isSection() {
		$controller = Controller::curr();
		$project = $controller->getField('CurrentProject');
		return $project && $this->ID == $project->ID;
	}

	/**
	 * Restrict access to viewing this project
	 *
	 * @param Member|null $member
	 * @return boolean
	 */
	public function canView($member = null) {
		if(!$member) {
			$member = Member::currentUser();
		}

		if(Permission::checkMember($member, 'ADMIN')) {
			return true;
		}

		return $member->inGroups($this->Viewers());
	}

	/**
	 * @param Member|null $member
	 *
	 * @return bool
	 */
	public function canRestore($member = null) {
		return (bool)$this->Environments()->filterByCallback(function($env) use($member) {
			return $env->canRestore($member);
		})->Count();
	}

	/**
	 * @param Member|null $member
	 *
	 * @return bool
	 */
	public function canBackup($member = null) {
		return (bool)$this->Environments()->filterByCallback(function($env) use($member) {
			return $env->canBackup($member);
		})->Count();
	}

	/**
	 * @param Member|null $member
	 *
	 * @return bool
	 */
	public function canUploadArchive($member = null) {
		return (bool)$this->Environments()->filterByCallback(function($env) use($member) {
			return $env->canUploadArchive($member);
		})->Count();
	}

	/**
	 * @param Member|null $member
	 *
	 * @return bool
	 */
	public function canDownloadArchive($member = null) {
		return (bool)$this->Environments()->filterByCallback(function($env) use($member) {
			return $env->canDownloadArchive($member);
		})->Count();
	}

	/**
	 * @return DataList
	 */
	public function DataArchives() {
		$envIds = $this->Environments()->column('ID');
		return DNDataArchive::get()->filter('EnvironmentID', $envIds);
	}

	/**
	 * Return all archives which are "manual upload requests",
	 * meaning they don't have a file attached to them (yet).
	 *
	 * @return DataList
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
		if(file_exists($this->getPrivateKeyPath())) {
			// Key-pair is available, use it.
			$processEnv = array(
				'IDENT_KEY' => $this->getPrivateKeyPath(),
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
	 * @return Gitonomy\Git\Repository
	 */
	public function getRepository() {
		if(!$this->repoExists()) {
			return false;
		}
		return new Gitonomy\Git\Repository($this->getLocalCVSPath());
	}

	/**
	 * Provides a list of environments found in this project.
	 * CAUTION: filterByCallback will change this into an ArrayList!
	 *
	 * @return ArrayList
	 */
	public function DNEnvironmentList() {

		if(!self::$_current_member_cache) {
			self::$_current_member_cache = Member::currentUser();
		}

		if(self::$_current_member_cache === false) {
			return new ArrayList();
		}

		$currentMember = self::$_current_member_cache;
		return $this->Environments()
			->filterByCallBack(function($item) use ($currentMember) {
				return $item->canView($currentMember);
			});
	}

	public function EnvironmentsByUsage($usage) {
		return $this->DNEnvironmentList()->filter('Usage', $usage);
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
	 * @return string
	 */
	public function Link($action='') {
		return Controller::join_links("naut", "project", $this->Name, $action);
	}

	/**
	 * @return string
	 */
	public function ToggleStarLink() {
		return $this->Link('/star');
	}

	/**
	 * @return bool
	 */
	public function IsStarred() {
		$member = Member::currentUser();
		if($member === null) {
			return false;
		}
		$favourited = $this->StarredBy()->filter('MemberID', $member->ID);
		if($favourited->count() == 0) {
			return false;
		}
		return true;
	}

	/**
	 * @param string $action
	 * @return string
	 */
	public function APILink($action) {
		return Controller::join_links("naut", "api", $this->Name, $action);
	}

	/**
	 * @return FieldList
	 */
	public function getCMSFields() {
		$fields = parent::getCMSFields();

		/** @var GridField $environments */
		$environments = $fields->dataFieldByName("Environments");

		$fields->fieldByName("Root")->removeByName("Viewers");
		$fields->fieldByName("Root")->removeByName("Environments");
		$fields->fieldByName("Root")->removeByName("LocalCVSPath");

		$diskQuotaDesc = 'This is the maximum amount of disk space (in megabytes) that all environments within this '
			. 'project can use for stored snapshots';
		$fields->dataFieldByName('DiskQuotaMB')->setDescription($diskQuotaDesc);

		$projectNameDesc = 'Changing the name will <strong>reset</strong> the deploy configuration and avoid using non'
			. 'alphanumeric characters';
		$fields->fieldByName('Root.Main.Name')
			->setTitle('Project name')
			->setDescription($projectNameDesc);

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
	 * @return boolean
	 */
	public function projectFolderExists() {
		if(file_exists($this->DNData()->getEnvironmentDir().'/'.$this->Name)) {
			return true;
		}
		return false;
	}

	/**
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
		if(!$this->CVSPath) {
			return;
		}
		if(isset($changedFields['CVSPath']) || isset($changedFields['Name'])) {
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
		$key = $this->getPublicKeyPath();

		if(file_exists($key)) {
			return file_get_contents($key);
		}
	}


	/**
	 * This returns that path of the public key if a key directory is set. It doesn't check whether the file exists.
	 *
	 * @return string|null
	 */
	public function getPublicKeyPath() {
		if($privateKey = $this->getPrivateKeyPath()) {
			return $privateKey . '.pub';
		}
		return null;
	}


	/**
	 * This returns that path of the private key if a key directory is set. It doesn't check whether the file exists.
	 *
	 * @return string|null
	 */
	public function getPrivateKeyPath() {
		$keyDir = $this->getKeyDir();
		if(!empty($keyDir)) {
			$filter = FileNameFilter::create();
			$name = $filter->filter($this->Name);
			return $keyDir . '/' . $name;
		}
		return null;
	}


	/**
	 * Returns the location of the projects key dir if one exists.
	 *
	 * @return string|null
	 */
	public function getKeyDir() {
		$keyDir = $this->DNData()->getKeyDir();
		if(!$keyDir) {
			return null;
		}

		$filter = FileNameFilter::create();
		$name = $filter->filter($this->Name);

		return $this->DNData()->getKeyDir() . '/' . $name;
	}

	/**
	 * Setup a gridfield for the environment configs
	 *
	 * @param FieldList $fields
	 * @param GridField $environments
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
		if($showUrl) {
			return $this->CVSPath;
		}
	}

	/**
	 * Whitelist configuration that describes how to convert a repository URL into a link
	 * to a web user interface for that URL
	 *
	 * Consists of a hash of "full.lower.case.domain" => {configuration} key/value pairs
	 *
	 * {configuration} can either be boolean true to auto-detect both the host and the
	 * name of the UI provider, or a nested array that overrides either one or both
	 * of the auto-detected valyes
	 *
	 * @var array
	 */
	static private $repository_interfaces = array(
		'github.com' => array(
			'icon' => 'deploynaut/img/github.png'
		),
		'bitbucket.org' => array(
			'commit' => 'commits'
		),
		'repo.or.cz' => array(
			'scheme' => 'http',
			'name' => 'repo.or.cz',
			'regex' => array('^(.*)$' => '/w$1')
		),

		/* Example for adding your own gitlab repository and override all auto-detected values (with their defaults)
		'gitlab.mysite.com' => array(
			'icon' => 'deploynaut/img/git.png',
			'host' => 'gitlab.mysite.com',
			'name' => 'Gitlab',
			'regex' => array('.git$' => ''),
			'commit' => "commit"
		),
		*/
	);

	/**
	 * Get a ViewableData structure describing the UI tool that lets the user view the repository code
	 * @return ArrayData
	 */
	public function getRepositoryInterface() {
		$interfaces = $this->config()->repository_interfaces;

		/* Look for each whitelisted hostname */
		foreach($interfaces as $host => $interface) {
			/* See if the CVS Path is for this hostname, followed by some junk (maybe a port), then the path */
			if(preg_match('{^[^.]*' . $host . '(.*?)([/a-zA-Z].+)}', $this->CVSPath, $match)) {

				$path = $match[2];

				$scheme = isset($interface['scheme']) ? $interface['scheme'] : 'https';
				$host = isset($interface['host']) ? $interface['host'] : $host;
				$regex = isset($interface['regex']) ? $interface['regex'] : array('\.git$' => '');

				$components = explode('.', $host);

				foreach($regex as $pattern => $replacement) {
					$path = preg_replace('/' . $pattern . '/', $replacement, $path);
				}

				$uxurl = Controller::join_links($scheme . '://', $host, $path);

				if(array_key_exists('commit', $interface) && $interface['commit'] == false) {
					$commiturl = false;
				} else {
					$commiturl = Controller::join_links($uxurl, isset($interface['commit']) ? $interface['commit'] : 'commit');
				}

				return new ArrayData(array(
					'Name'      => isset($interface['name']) ? $interface['name'] : ucfirst($components[0]),
					'Icon'      => isset($interface['icon']) ? $interface['icon'] : 'deploynaut/img/git.png',
					'URL'       => $uxurl,
					'CommitURL' => $commiturl
				));
			}
		}
	}

	/**
	 * @return string
	 */
	protected function getProjectFolderPath() {
		return $this->DNData()->getEnvironmentDir().'/'.$this->Name;
	}
}
