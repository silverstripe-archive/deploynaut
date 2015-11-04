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
 * @method ManyManyList StarredBy()
 */
class DNProject extends DataObject {

	/**
	 * @var array
	 */
	public static $db = array(
		"Name" => "Varchar",
		"CVSPath" => "Varchar(255)",
		"DiskQuotaMB" => "Int",
		"AllowedEnvironmentType" => "Varchar(255)",
	);

	/**
	 * @var array
	 */
	public static $has_many = array(
		"Environments" => "DNEnvironment",
		"CreateEnvironments" => "DNCreateEnvironment"
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

	/**
	 * @var string
	 */
	private static $singular_name = 'Project';

	/**
	 * @var string
	 */
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
	 * In-memory cache to determine whether clone repo was called.
	 * @var array
	 */
	private static $has_cloned_cache = array();

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
	 * @param int $round Number of decimal places to round to
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
	 *
	 * @return boolean
	 */
	public function HasExceededDiskQuota() {
		return $this->getUsedQuotaMB(0) >= $this->getDiskQuotaMB();
	}

	/**
	 * Is there a disk quota set for this project?
	 *
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

		if(DNRoot::FlagSnapshotsEnabled() && $this->isProjectReady()) {
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
	 *
	 * @return bool
	 */
	public function isCurrent() {
		return $this->isSection() && Controller::curr()->getAction() == 'project';
	}

	/**
	 * Return the current object from $this->Menu()
	 * Good for making titles and things
	 *
	 * @return DataObject
	 */
	public function CurrentMenu() {
		return $this->Menu()->filter('IsSection', true)->First();
	}

	/**
	 * Is this project currently in a controller that is handling it or performing a sub-task?
	 *
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
		if ($this->allowedAny(
			array(
				DNRoot::ALLOW_PROD_SNAPSHOT,
				DNRoot::ALLOW_NON_PROD_SNAPSHOT
			),
			$member
		)) {
			return true;
		}

		return (bool)$this->Environments()->filterByCallback(function($env) use($member) {
			return $env->canRestore($member);
		})->Count();
	}

	/**
	 * @param Member|null $member
	 * @return bool
	 */
	public function canBackup($member = null) {
		if ($this->allowedAny(
			array(
				DNRoot::ALLOW_PROD_SNAPSHOT,
				DNRoot::ALLOW_NON_PROD_SNAPSHOT
			),
			$member
		)) {
			return true;
		}

		return (bool)$this->Environments()->filterByCallback(function($env) use($member) {
			return $env->canBackup($member);
		})->Count();
	}

	/**
	 * @param Member|null $member
	 * @return bool
	 */
	public function canUploadArchive($member = null) {
		if ($this->allowedAny(
			array(
				DNRoot::ALLOW_PROD_SNAPSHOT,
				DNRoot::ALLOW_NON_PROD_SNAPSHOT
			),
			$member
		)) {
			return true;
		}

		return (bool)$this->Environments()->filterByCallback(function($env) use($member) {
			return $env->canUploadArchive($member);
		})->Count();
	}

	/**
	 * @param Member|null $member
	 * @return bool
	 */
	public function canDownloadArchive($member = null) {
		if ($this->allowedAny(
			array(
				DNRoot::ALLOW_PROD_SNAPSHOT,
				DNRoot::ALLOW_NON_PROD_SNAPSHOT
			),
			$member
		)) {
			return true;
		}

		return (bool)$this->Environments()->filterByCallback(function($env) use($member) {
			return $env->canDownloadArchive($member);
		})->Count();
	}

	/**
	 * This is a permission check for the front-end only.
	 *
	 * Only admins can create environments for now. Also, we need to check the value
	 * of AllowedEnvironmentType which dictates which backend to use to render the form.
	 *
	 * @param Member|null $member
	 *
	 * @return bool
	 */
	public function canCreateEnvironments($member = null) {
		$envType = $this->AllowedEnvironmentType;
		if($envType) {
			$env = Injector::inst()->get($envType);
			if($env instanceof EnvironmentCreateBackend) {
				return $this->allowed(DNRoot::ALLOW_CREATE_ENVIRONMENT, $member);
			}
		}
		return false;
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
	 *
	 * @return DNReferenceList
	 */
	public function DNBuildList() {
		return DNReferenceList::create($this, $this->DNData());
	}

	/**
	 * Provides a list of the branches in this project.
	 *
	 * @return DNBranchList
	 */
	public function DNBranchList() {
		if($this->CVSPath && !$this->repoExists()) {
			$this->cloneRepo();
		}
		return DNBranchList::create($this, $this->DNData());
	}

	/**
	 * Provides a list of the tags in this project.
	 *
	 * @return DNReferenceList
	 */
	public function DNTagList() {
		if($this->CVSPath && !$this->repoExists()) {
			$this->cloneRepo();
		}
		return DNReferenceList::create($this, $this->DNData(), null, null, true);
	}

	/**
	 * @return false|Gitonomy\Git\Repository
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

	/**
	 * @param string $usage
	 * @return ArrayList
	 */
	public function EnvironmentsByUsage($usage) {
		return $this->DNEnvironmentList()->filter('Usage', $usage);
	}

	/**
	 * Returns a map of envrionment name to build name
	 *
	 * @return false|DNDeployment
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
	 * @param string
	 * @return string
	 */
	public function Link($action = '') {
		return Controller::join_links("naut", "project", $this->Name, $action);
	}

	/**
	 * @return string|null
	 */
	public function CreateEnvironmentLink() {
		if($this->canCreateEnvironments()) {
			return $this->Link('createenv');
		}
		return null;
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

		$environmentTypes = ClassInfo::implementorsOf('EnvironmentCreateBackend');
		$types = array();
		foreach($environmentTypes as $type) {
			$types[$type] = $type;
		}

		$fields->addFieldsToTab('Root.Main', array(
			DropdownField::create(
				'AllowedEnvironmentType',
				'Allowed Environment Type',
				$types
			)->setDescription('This defined which form to show on the front end for '
				. 'environment creation. This will not affect backend functionality.')
			->setEmptyString(' - None - '),
		));

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
		return file_exists($this->getProjectFolderPath());
	}

	/**
	 * @return bool
	 */
	public function repoExists() {
		return file_exists(sprintf('%s/HEAD', $this->getLocalCVSPath()));
	}

	/**
	 * Setup a job to clone a git repository.
	 * @return string resque token
	 */
	public function cloneRepo() {
		// Avoid this being called multiple times in the same request
		if(!isset(self::$has_cloned_cache[$this->ID])) {
			$fetch = DNGitFetch::create();
			$fetch->ProjectID = $this->ID;
			$fetch->write();

			// passing true here tells DNGitFetch to force a git clone, otherwise
			// it will just update the repo if it already exists. We want to ensure
			// we're always cloning a new repo in this case, as the git URL may have changed.
			$fetch->start(true);

			self::$has_cloned_cache[$this->ID] = true;
		}
	}

	/**
	 * @return string
	 */
	public function getLocalCVSPath() {
		return sprintf('%s/%s', DEPLOYNAUT_LOCAL_VCS_PATH, $this->Name);
	}

	public function onBeforeWrite() {
		parent::onBeforeWrite();

		if($this->CreateEnvFolder && !file_exists($this->getProjectFolderPath())) {
			mkdir($this->getProjectFolderPath());
		}
	}

	public function onAfterWrite() {
		parent::onAfterWrite();

		if(!$this->CVSPath) {
			return;
		}

		$changedFields = $this->getChangedFields(true, 2);
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

		// Delete local repository
		if(file_exists($this->getLocalCVSPath())) {
			Filesystem::removeFolder($this->getLocalCVSPath());
		}

		// Delete project template
		if(file_exists($this->getProjectFolderPath()) && Config::inst()->get('DNEnvironment', 'allow_web_editing')) {
			Filesystem::removeFolder($this->getProjectFolderPath());
		}
	}

	/**
	 * Fetch the public key for this project.
	 *
	 * @return string|void
	 */
	public function getPublicKey() {
		$key = $this->getPublicKeyPath();

		if(file_exists($key)) {
			return trim(file_get_contents($key));
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
	 *
	 * @return void|string
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
			'icon' => 'deploynaut/img/github.png',
			'name' => 'Github.com',
		),
		'bitbucket.org' => array(
			'commit' => 'commits',
			'name' => 'Bitbucket.org',
		),
		'repo.or.cz' => array(
			'scheme' => 'http',
			'name' => 'repo.or.cz',
			'regex' => array('^(.*)$' => '/w$1'),
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
	 *
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
					$commiturl = Controller::join_links(
						$uxurl,
						isset($interface['commit']) ? $interface['commit'] : 'commit'
					);
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
		return sprintf('%s/%s', $this->DNData()->getEnvironmentDir(), $this->Name);
	}

	/**
	 * Convenience wrapper for a single permission code.
	 *
	 * @param string $code
	 * @return SS_List
	 */
	public function whoIsAllowed($code) {
		return $this->whoIsAllowedAny(array($code));
	}

	/**
	 * List members who have $codes on this project.
	 * Does not support Permission::DENY_PERMISSION malarky, same as Permission::get_groups_by_permission anyway...
	 *
	 * @param array|string $codes
	 * @return SS_List
	 */
	public function whoIsAllowedAny($codes) {
		if(!is_array($codes)) $codes = array($codes);

		$SQLa_codes = Convert::raw2sql($codes);
		$SQL_codes = join("','", $SQLa_codes);

		return DataObject::get('Member')
			->where("\"PermissionRoleCode\".\"Code\" IN ('$SQL_codes') OR \"Permission\".\"Code\" IN ('$SQL_codes')")
			->filter("DNProject_Viewers.DNProjectID", $this->ID)
			->leftJoin('Group_Members', "\"Group_Members\".\"MemberID\" = \"Member\".\"ID\"")
			->leftJoin('Group', "\"Group_Members\".\"GroupID\" = \"Group\".\"ID\"")
			->leftJoin('DNProject_Viewers', "\"DNProject_Viewers\".\"GroupID\" = \"Group\".\"ID\"")
			->leftJoin('Permission', "\"Permission\".\"GroupID\" = \"Group\".\"ID\"")
			->leftJoin('Group_Roles', "\"Group_Roles\".\"GroupID\" = \"Group\".\"ID\"")
			->leftJoin('PermissionRole', "\"Group_Roles\".\"PermissionRoleID\" = \"PermissionRole\".\"ID\"")
			->leftJoin('PermissionRoleCode', "\"PermissionRoleCode\".\"RoleID\" = \"PermissionRole\".\"ID\"");
	}

	/**
	 * Convenience wrapper for a single permission code.
	 *
	 * @param string $code
	 * @param Member|null $member
	 *
	 * @return bool
	 */
	public function allowed($code, $member = null) {
		return $this->allowedAny(array($code), $member);
	}

	/**
	 * Checks if a group is allowed to the project and the permission code
	 *
	 * @param string $permissionCode
	 * @param Group $group
	 *
	 * @return bool
	 */
	public function groupAllowed($permissionCode, Group $group) {
		$viewers = $this->Viewers();
		if(!$viewers->find('ID', $group->ID)) {
			return false;
		}
		$groups = Permission::get_groups_by_permission($permissionCode);
		if(!$groups->find('ID', $group->ID)) {
			return false;
		}
		return true;
	}

	/**
	 * Check if member has a permission code in this project.
	 *
	 * @param array|string $codes
	 * @param Member|null $member
	 *
	 * @return bool
	 */
	public function allowedAny($codes, $member = null) {
		if (!$member) {
			$member = Member::currentUser();
		}

		if(Permission::checkMember($member, 'ADMIN')) return true;

		$hits = $this->whoIsAllowedAny($codes)->filter('Member.ID', $member->ID)->count();
		return ($hits>0 ? true : false);
	}

	/**
	 * Checks if the environment has been fully built.
	 *
	 * @return bool
	 */
	public function isProjectReady() {
		if($this->getRunningInitialEnvironmentCreations()->count() > 0) {
			// We're still creating the initial environments for this project so we're 
			// not quite done
			return false;
		}

		// Provide a hook for further checks. Logic stolen from 
		// {@see DataObject::extendedCan()}
		$isDone = $this->extend('isProjectReady');
		if($isDone && is_array($isDone)) {
			$isDone = array_filter($isDone, function($val) {
				return !is_null($val);
			});

			// If anything returns false then we're not ready.
			if($isDone) return min($isDone);
		}

		return true;
	}

	/**
	 * Returns a list of environments still being created.
	 *
	 * @return SS_List
	 */
	public function getRunningEnvironmentCreations() {
		return $this->CreateEnvironments()
			->filter('Status', ['Queued', 'Started']);
	}

	/**
	 * Returns a list of initial environments created for this project.
	 * 
	 * @return DataList
	 */
	public function getInitialEnvironmentCreations() {
		return $this->CreateEnvironments()->filter('IsInitialEnvironment', true);
	}

	/**
	 * Only returns initial environments that are being created.
	 *
	 * @return DataList
	 */
	public function getRunningInitialEnvironmentCreations() {
		return $this->getInitialEnvironmentCreations()
			->filter('Status', ['Queued', 'Started']);
	}

	/**
	 * Returns a list of completed initial environment creations. This includes failed tasks.
	 *
	 * @return DataList
	 */
	public function getCompleteInitialEnvironmentCreations() {
		return $this->getInitialEnvironmentCreations()
			->exclude('Status', ['Queued', 'Started']);
	}

	/**
	 * @return ValidationResult
	 */
	protected function validate() {
		$validation = parent::validate();
		if($validation->valid()) {
			if(empty($this->Name)) {
				return $validation->error('The stack must have a name.');
			}

			// The name is used to build filepaths so should be restricted
			if(!preg_match('/^[a-zA-Z0-9][a-zA-Z0-9\-\_]+$/', $this->Name)) {
				return $validation->error('Project name can only contain alphanumeric, hyphens and underscores.');
			}

			if(empty($this->CVSPath)) {
				return $validation->error('You must provide a repository URL.');
			}

			$existing = DNProject::get()->filter('Name', $this->Name);
			if($this->ID) {
				$existing = $existing->exclude('ID', $this->ID);
			}
			if($existing->count() > 0) {
				return $validation->error('A stack already exists with that name.');
			}
		}
		return $validation;
	}

	/**
	 * @param Member $member
	 *
	 * @return bool
	 */
	public function canCreate($member = null) {
		if(!$member) $member = Member::currentUser();
		if(!$member) return false;

		if(Permission::checkMember($member, 'ADMIN')) {
			return true;
		}

		// This calls canCreate on extensions.
		return parent::canCreate($member);
	}

}

