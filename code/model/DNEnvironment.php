<?php

/**
 * DNEnvironment
 *
 * This dataobject represents a target environment that source code can be deployed to.
 * Permissions are controlled by environment, see the various many-many relationships.
 *
 * @property string $Filename
 * @property string $Name
 * @property string $URL
 * @property string $BackendIdentifier
 * @property bool $Usage
 *
 * @method DNProject Project()
 * @property int $ProjectID
 *
 * @method HasManyList Deployments()
 * @method HasManyList DataArchives()
 *
 * @method ManyManyList Viewers()
 * @method ManyManyList ViewerGroups()
 * @method ManyManyList Deployers()
 * @method ManyManyList DeployerGroups()
 * @method ManyManyList CanRestoreMembers()
 * @method ManyManyList CanRestoreGroups()
 * @method ManyManyList CanBackupMembers()
 * @method ManyManyList CanBackupGroups()
 * @method ManyManyList ArchiveUploaders()
 * @method ManyManyList ArchiveUploaderGroups()
 * @method ManyManyList ArchiveDownloaders()
 * @method ManyManyList ArchiveDownloaderGroups()
 * @method ManyManyList ArchiveDeleters()
 * @method ManyManyList ArchiveDeleterGroups()
 */
class DNEnvironment extends DataObject {

	/**
	 * If this is set to a full pathfile, it will be used as template
	 * file when creating a new capistrano environment config file.
	 *
	 * If not set, the default 'environment.template' from the module
	 * root is used
	 *
	 * @config
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
	 * @var array
	 */
	private static $casting = array(
		'DeployHistory' => 'Text'
	);

	/**
	 * Allowed backends. A map of Injector identifier to human-readable label.
	 *
	 * @config
	 * @var array
	 */
	private static $allowed_backends = array();

	/**
	 * @var array
	 */
	public static $db = array(
		"Filename" => "Varchar(255)",
		"Name" => "Varchar(255)",
		"URL" => "Varchar(255)",
		"BackendIdentifier" => "Varchar(255)", // Injector identifier of the DeploymentBackend
		"Usage" => "Enum('Production, UAT, Test, Unspecified', 'Unspecified')"
	);

	/**
	 * @var array
	 */
	public static $has_one = array(
		"Project" => "DNProject",
		"CreateEnvironment" => "DNCreateEnvironment"
	);

	/**
	 * @var array
	 */
	public static $has_many = array(
		"Deployments" => "DNDeployment",
		"DataArchives" => "DNDataArchive",
	);

	/**
	 * @var array
	 */
	public static $many_many = array(
		"Viewers"            => "Member", // Who can view this environment
		"ViewerGroups"       => "Group",
		"Deployers"          => "Member", // Who can deploy to this environment
		"DeployerGroups" => "Group",
		"CanRestoreMembers"  => "Member", // Who can restore archive files to this environment
		"CanRestoreGroups"  => "Group",
		"CanBackupMembers"   => "Member", // Who can backup archive files from this environment
		"CanBackupGroups"   => "Group",
		"ArchiveUploaders"   => "Member", // Who can upload archive files linked to this environment
		"ArchiveUploaderGroups" => "Group",
		"ArchiveDownloaders" => "Member", // Who can download archive files from this environment
		"ArchiveDownloaderGroups" => "Group",
		"ArchiveDeleters"    => "Member", // Who can delete archive files from this environment,
		"ArchiveDeleterGroups" => "Group",
	);

	/**
	 * @var array
	 */
	public static $summary_fields = array(
		"Name" => "Environment Name",
		"Usage" => "Usage",
		"URL" => "URL",
		"DeployersList" => "Can Deploy List",
		"CanRestoreMembersList" => "Can Restore List",
		"CanBackupMembersList" => "Can Backup List",
		"ArchiveUploadersList" => "Can Upload List",
		"ArchiveDownloadersList" => "Can Download List",
		"ArchiveDeletersList"  => "Can Delete List",
	);

	private static $singular_name = 'Capistrano Environment';

	private static $plural_name = 'Capistrano Environments';

	/**
	 * @var array
	 */
	public static $searchable_fields = array(
		"Name",
	);

	/**
	 * @var string
	 */
	private static $default_sort = 'Name';

	/**
	 * Used by the sync task
	 *
	 * @param string $path
	 * @return \DNEnvironment
	 */
	public static function create_from_path($path) {
		$e = DNEnvironment::create();
		$e->Filename = $path;
		$e->Name = basename($e->Filename, '.rb');

		// add each administrator member as a deployer of the new environment
		$adminGroup = Group::get()->filter('Code', 'administrators')->first();
		$e->DeployerGroups()->add($adminGroup);
		return $e;
	}

	/**
	 * Get the deployment backend used for this environment.
	 *
	 * Enforces compliance with the allowed_backends setting; if the DNEnvironment.BackendIdentifier value is
	 * illegal then that value is ignored.
	 *
	 * @return DeploymentBackend
	 */
	public function Backend(DeploynautJob $job = null) {
		$backends = array_keys($this->config()->get('allowed_backends', Config::FIRST_SET));
		switch(sizeof($backends)) {
		// Nothing allowed, use the default value "DeploymentBackend"
			case 0:
				$backend = "DeploymentBackend";
				break;

			// Only 1 thing allowed, use that
			case 1:
				$backend = $backends[0];
				break;

			// Multiple choices, use our choice if it's legal, otherwise default to the first item on the list
			default:
				$backend = $this->BackendIdentifier;
				if(!in_array($backend, $backends)) {
					$backend = $backends[0];
				}
		}

		$backendObj = Injector::inst()->create($backend);
		$backendObj->setJob($job);
		return $backendObj;
	}

	/**
	 * @param SS_HTTPRequest $request
	 *
	 * @return DeploymentStrategy
	 */
	public function getDeployStrategy(\SS_HTTPRequest $request) {
		return $this->Backend()->planDeploy($this, $request->requestVars());
	}

	public function Menu() {
		$list = new ArrayList();

		$controller = Controller::curr();
		$actionType = $controller->getField('CurrentActionType');

		$list->push(new ArrayData(array(
			'Link' => sprintf('naut/project/%s/environment/%s', $this->Project()->Name, $this->Name),
			'Title' => 'Deployments',
			'IsCurrent' => $this->isCurrent(),
			'IsSection' => $this->isSection() && $actionType == DNRoot::ACTION_DEPLOY
		)));

		$this->extend('updateMenu', $list);

		return $list;
	}

	/**
	 * Return the current object from $this->Menu()
	 * Good for making titles and things
	 */
	public function CurrentMenu() {
		return $this->Menu()->filter('IsSection', true)->First();
	}

	/**
	 * Return a name for this environment.
	 *
	 * @param string $separator The string used when concatenating project with env name
	 * @return string
	 */
	public function getFullName($separator = ':') {
		return sprintf('%s%s%s', $this->Project()->Name, $separator, $this->Name);
	}

	/**
	 * URL for the environment that can be used if no explicit URL is set.
	 */
	public function getDefaultURL() {
		return null;
	}

	public function getBareURL() {
		$url = parse_url($this->URL);
		if(isset($url['host'])) {
			return strtolower($url['host']);
		}
	}

	public function getBareDefaultURL() {
		$url = parse_url($this->getDefaultURL());
		if(isset($url['host'])) {
			return strtolower($url['host']);
		}
	}

	/**
	 * Environments are only viewable by people that can view the environment.
	 *
	 * @param Member|null $member
	 * @return boolean
	 */
	public function canView($member = null) {
		if(!$member) {
			$member = Member::currentUser();
		}
		if(!$member) {
			return false;
		}
		// Must be logged in to check permissions

		if(Permission::checkMember($member, 'ADMIN')) {
			return true;
		}

		// if no Viewers or ViewerGroups defined, fallback to DNProject::canView permissions
		if($this->Viewers()->exists() || $this->ViewerGroups()->exists()) {
			return $this->Viewers()->byID($member->ID)
				|| $member->inGroups($this->ViewerGroups());
		}

		return $this->Project()->canView($member);
	}

	/**
	 * Allow deploy only to some people.
	 *
	 * @param Member|null $member
	 * @return boolean
	 */
	public function canDeploy($member = null) {
		if(!$member) {
			$member = Member::currentUser();
		}
		if(!$member) {
			return false;
		}
		// Must be logged in to check permissions

		if ($this->Usage==='Production' || $this->Usage==='Unspecified') {
			if ($this->Project()->allowed(DNRoot::ALLOW_PROD_DEPLOYMENT, $member)) return true;
		} else {
			if ($this->Project()->allowed(DNRoot::ALLOW_NON_PROD_DEPLOYMENT, $member)) return true;
		}

		return $this->Deployers()->byID($member->ID)
			|| $member->inGroups($this->DeployerGroups());
	}

	/**
	 * Provide reason why the user cannot deploy.
	 *
	 * @return string
	 */
	public function getCannotDeployMessage() {
		return 'You cannot deploy to this environment.';
	}

	/**
	 * Allows only selected {@link Member} objects to restore {@link DNDataArchive} objects into this
	 * {@link DNEnvironment}.
	 *
	 * @param Member|null $member The {@link Member} object to test against. If null, uses Member::currentMember();
	 * @return boolean true if $member can restore, and false if they can't.
	 */
	public function canRestore($member = null) {
		if(!$member) {
			$member = Member::currentUser();
		}
		if(!$member) {
			return false;
		}
		// Must be logged in to check permissions

		if ($this->Usage==='Production' || $this->Usage==='Unspecified') {
			if ($this->Project()->allowed(DNRoot::ALLOW_PROD_SNAPSHOT, $member)) return true;
		} else {
			if ($this->Project()->allowed(DNRoot::ALLOW_NON_PROD_SNAPSHOT, $member)) return true;
		}

		return $this->CanRestoreMembers()->byID($member->ID)
			|| $member->inGroups($this->CanRestoreGroups());
	}

	/**
	 * Allows only selected {@link Member} objects to backup this {@link DNEnvironment} to a {@link DNDataArchive}
	 * file.
	 *
	 * @param Member|null $member The {@link Member} object to test against. If null, uses Member::currentMember();
	 * @return boolean true if $member can backup, and false if they can't.
	 */
	public function canBackup($member = null) {
		$project = $this->Project();
		if($project->HasDiskQuota() && $project->HasExceededDiskQuota()) {
			return false;
		}

		if(!$member) {
			$member = Member::currentUser();
		}
		// Must be logged in to check permissions
		if(!$member) {
			return false;
		}

		if ($this->Usage==='Production' || $this->Usage==='Unspecified') {
			if ($this->Project()->allowed(DNRoot::ALLOW_PROD_SNAPSHOT, $member)) return true;
		} else {
			if ($this->Project()->allowed(DNRoot::ALLOW_NON_PROD_SNAPSHOT, $member)) return true;
		}

		return $this->CanBackupMembers()->byID($member->ID)
			|| $member->inGroups($this->CanBackupGroups());
	}

	/**
	 * Allows only selected {@link Member} objects to upload {@link DNDataArchive} objects linked to this
	 * {@link DNEnvironment}.
	 *
	 * Note: This is not uploading them to the actual environment itself (e.g. uploading to the live site) - it is the
	 * process of uploading a *.sspak file into Deploynaut for later 'restoring' to an environment. See
	 * {@link self::canRestore()}.
	 *
	 * @param Member|null $member The {@link Member} object to test against. If null, uses Member::currentMember();
	 * @return boolean true if $member can upload archives linked to this environment, false if they can't.
	 */
	public function canUploadArchive($member = null) {
		$project = $this->Project();
		if($project->HasDiskQuota() && $project->HasExceededDiskQuota()) {
			return false;
		}

		if(!$member) {
			$member = Member::currentUser();
		}
		if(!$member) {
			return false;
		}
		// Must be logged in to check permissions

		if ($this->Usage==='Production' || $this->Usage==='Unspecified') {
			if ($this->Project()->allowed(DNRoot::ALLOW_PROD_SNAPSHOT, $member)) return true;
		} else {
			if ($this->Project()->allowed(DNRoot::ALLOW_NON_PROD_SNAPSHOT, $member)) return true;
		}

		return $this->ArchiveUploaders()->byID($member->ID)
			|| $member->inGroups($this->ArchiveUploaderGroups());
	}

	/**
	 * Allows only selected {@link Member} objects to download {@link DNDataArchive} objects from this
	 * {@link DNEnvironment}.
	 *
	 * @param Member|null $member The {@link Member} object to test against. If null, uses Member::currentMember();
	 * @return boolean true if $member can download archives from this environment, false if they can't.
	 */
	public function canDownloadArchive($member = null) {
		if(!$member) {
			$member = Member::currentUser();
		}
		if(!$member) {
			return false;
		}
		// Must be logged in to check permissions

		if ($this->Usage==='Production' || $this->Usage==='Unspecified') {
			if ($this->Project()->allowed(DNRoot::ALLOW_PROD_SNAPSHOT, $member)) return true;
		} else {
			if ($this->Project()->allowed(DNRoot::ALLOW_NON_PROD_SNAPSHOT, $member)) return true;
		}

		return $this->ArchiveDownloaders()->byID($member->ID)
			|| $member->inGroups($this->ArchiveDownloaderGroups());
	}

	/**
	 * Allows only selected {@link Member} objects to delete {@link DNDataArchive} objects from this
	 * {@link DNEnvironment}.
	 *
	 * @param Member|null $member The {@link Member} object to test against. If null, uses Member::currentMember();
	 * @return boolean true if $member can delete archives from this environment, false if they can't.
	 */
	public function canDeleteArchive($member = null) {
		if(!$member) {
			$member = Member::currentUser();
		}
		if(!$member) {
			return false;
		}
		// Must be logged in to check permissions

		if ($this->Usage==='Production' || $this->Usage==='Unspecified') {
			if ($this->Project()->allowed(DNRoot::ALLOW_PROD_SNAPSHOT, $member)) return true;
		} else {
			if ($this->Project()->allowed(DNRoot::ALLOW_NON_PROD_SNAPSHOT, $member)) return true;
		}

		return $this->ArchiveDeleters()->byID($member->ID)
			|| $member->inGroups($this->ArchiveDeleterGroups());
	}
	/**
	 * Get a string of groups/people that are allowed to deploy to this environment.
	 * Used in DNRoot_project.ss to list {@link Member}s who have permission to perform this action.
	 *
	 * @return string
	 */
	public function getDeployersList() {
		return implode(
			", ",
			array_merge(
				$this->DeployerGroups()->column("Title"),
				$this->Deployers()->column("FirstName")
			)
		);
	}

	/**
	 * Get a string of groups/people that are allowed to restore {@link DNDataArchive} objects into this environment.
	 *
	 * @return string
	 */
	public function getCanRestoreMembersList() {
		return implode(
			", ",
			array_merge(
				$this->CanRestoreGroups()->column("Title"),
				$this->CanRestoreMembers()->column("FirstName")
			)
		);
	}

	/**
	 * Get a string of groups/people that are allowed to backup {@link DNDataArchive} objects from this environment.
	 *
	 * @return string
	 */
	public function getCanBackupMembersList() {
		return implode(
			", ",
			array_merge(
				$this->CanBackupGroups()->column("Title"),
				$this->CanBackupMembers()->column("FirstName")
			)
		);
	}

	/**
	 * Get a string of groups/people that are allowed to upload {@link DNDataArchive}
	 *  objects linked to this environment.
	 *
	 * @return string
	 */
	public function getArchiveUploadersList() {
		return implode(
			", ",
			array_merge(
				$this->ArchiveUploaderGroups()->column("Title"),
				$this->ArchiveUploaders()->column("FirstName")
			)
		);
	}

	/**
	 * Get a string of groups/people that are allowed to download {@link DNDataArchive} objects from this environment.
	 *
	 * @return string
	 */
	public function getArchiveDownloadersList() {
		return implode(
			", ",
			array_merge(
				$this->ArchiveDownloaderGroups()->column("Title"),
				$this->ArchiveDownloaders()->column("FirstName")
			)
		);
	}

	/**
	 * Get a string of groups/people that are allowed to delete {@link DNDataArchive} objects from this environment.
	 *
	 * @return string
	 */
	public function getArchiveDeletersList() {
		return implode(
			", ",
			array_merge(
				$this->ArchiveDeleterGroups()->column("Title"),
				$this->ArchiveDeleters()->column("FirstName")
			)
		);
	}

	/**
	 * @return DNData
	 */
	public function DNData() {
		return DNData::inst();
	}

	/**
	 * Get the current deployed build for this environment
	 *
	 * Dear people of the future: If you are looking to optimize this, simply create a CurrentBuildSHA(), which can be
	 * a lot faster. I presume you came here because of the Project display template, which only needs a SHA.
	 *
	 * @return false|DNDeployment
	 */
	public function CurrentBuild() {
		// The DeployHistory function is far too slow to use for this

		/** @var DNDeployment $deploy */
		$deploy = DNDeployment::get()->filter(array(
			'EnvironmentID' => $this->ID,
			'State' => 'Completed'
		))->sort('LastEdited DESC')->first();

		if(!$deploy || (!$deploy->SHA)) {
			return false;
		}

		$repo = $this->Project()->getRepository();
		if(!$repo) {
			return $deploy;
		}

		try {
			$commit = $repo->getCommit($deploy->SHA);
			if($commit) {
				$deploy->Message = Convert::raw2xml($commit->getMessage());
				$deploy->Committer = Convert::raw2xml($commit->getCommitterName());
				$deploy->CommitDate = $commit->getCommitterDate()->Format('d/m/Y g:ia');
				$deploy->Author = Convert::raw2xml($commit->getAuthorName());
				$deploy->AuthorDate = $commit->getAuthorDate()->Format('d/m/Y g:ia');
			}
			// We can't find this SHA, so we ignore adding a commit message to the deployment
		} catch(Exception $ex) { }

		return $deploy;
	}

	/**
	 * A history of all builds deployed to this environment
	 *
	 * @return ArrayList
	 */
	public function DeployHistory() {
		return $this->Deployments()
			->where('SHA IS NOT NULL')
			->sort('LastEdited DESC');
	}

	/**
	 * @param string $sha
	 * @return array
	 */
	protected function getCommitData($sha) {
		try {
			$repo = $this->Project()->getRepository();
			if($repo !== false) {
				$commit = new \Gitonomy\Git\Commit($repo, $sha);
				return [
					'AuthorName' => (string)Convert::raw2xml($commit->getAuthorName()),
					'AuthorEmail' => (string)Convert::raw2xml($commit->getAuthorEmail()),
					'Message' => (string)Convert::raw2xml($commit->getMessage()),
					'ShortHash' => Convert::raw2xml($commit->getFixedShortHash(8)),
					'Hash' => Convert::raw2xml($commit->getHash())
				];
			}
		} catch(\Gitonomy\Git\Exception\ReferenceNotFoundException $exc) {
			SS_Log::log($exc, SS_Log::WARN);
		}
		return array(
			'AuthorName' => '(unknown)',
			'AuthorEmail' => '(unknown)',
			'Message' => '(unknown)',
			'ShortHash' => $sha,
			'Hash' => '(unknown)',
		);
	}

	/**
	 * @return string
	 */
	public function Link() {
		return $this->Project()->Link() . "/environment/" . $this->Name;
	}

	/**
	 * Is this environment currently at the root level of the controller that handles it?
	 * @return bool
	 */
	public function isCurrent() {
		return $this->isSection() && Controller::curr()->getAction() == 'environment';
	}

	/**
	 * Is this environment currently in a controller that is handling it or performing a sub-task?
	 * @return bool
	 */
	public function isSection() {
		$controller = Controller::curr();
		$environment = $controller->getField('CurrentEnvironment');
		return $environment && $environment->ID == $this->ID;
	}


	/**
	 * Build a set of multi-select fields for assigning permissions to a pair of group and member many_many relations
	 *
	 * @param string $groupField Group field name
	 * @param string $memberField Member field name
	 * @param array $groups List of groups
	 * @param array $members List of members
	 * @return FieldGroup
	 */
	protected function buildPermissionField($groupField, $memberField, $groups, $members) {
		return FieldGroup::create(
			ListboxField::create($groupField, false, $groups)
				->setMultiple(true)
				->setAttribute('data-placeholder', 'Groups')
				->setAttribute('placeholder', 'Groups')
				->setAttribute('style', 'width: 400px;'),

			ListboxField::create($memberField, false, $members)
				->setMultiple(true)
				->setAttribute('data-placeholder', 'Members')
				->setAttribute('placeholder', 'Members')
				->setAttribute('style', 'width: 400px;')
		);
	}

	/**
	 * @return FieldList
	 */
	public function getCMSFields() {
		$fields = new FieldList(new TabSet('Root'));

		$project = $this->Project();
		if($project && $project->exists()) {
			$viewerGroups = $project->Viewers();
			$groups = $viewerGroups->sort('Title')->map()->toArray();
			$members = array();
			foreach($viewerGroups as $group) {
				foreach($group->Members()->map() as $k => $v) {
					$members[$k] = $v;
				}
			}
			asort($members);
		} else {
			$groups = array();
			$members = array();
		}

		// Main tab
		$fields->addFieldsToTab('Root.Main', array(
			// The Main.ProjectID
			TextField::create('ProjectName', 'Project')
				->setValue(($project = $this->Project()) ? $project->Name : null)
				->performReadonlyTransformation(),

			// The Main.Name
			TextField::create('Name', 'Environment name')
				->setDescription('A descriptive name for this environment, e.g. staging, uat, production'),


			$this->obj('Usage')->scaffoldFormField('Environment usage'),

			// The Main.URL field
			TextField::create('URL', 'Server URL')
				->setDescription('This url will be used to provide the front-end with a link to this environment'),

			// The Main.Filename
			TextField::create('Filename')
				->setDescription('The capistrano environment file name')
				->performReadonlyTransformation(),
		));

		// Backend identifier - pick from a named list of configurations specified in YML config
		$backends = $this->config()->get('allowed_backends', Config::FIRST_SET);
		// If there's only 1 backend, then user selection isn't needed
		if(sizeof($backends) > 1) {
			$fields->addFieldToTab('Root.Main', DropdownField::create('BackendIdentifier', 'Deployment backend')
				->setSource($backends)
				->setDescription('What kind of deployment system should be used to deploy to this environment'));
		}

		$fields->addFieldsToTab('Root.UserPermissions', array(
			// The viewers of the environment
			$this
				->buildPermissionField('ViewerGroups', 'Viewers', $groups, $members)
				->setTitle('Who can view this environment?')
				->setDescription('Groups or Users who can view this environment'),

			// The Main.Deployers
			$this
				->buildPermissionField('DeployerGroups', 'Deployers', $groups, $members)
				->setTitle('Who can deploy?')
				->setDescription('Groups or Users who can deploy to this environment'),

			// A box to select all snapshot options.
			$this
				->buildPermissionField('TickAllSnapshotGroups', 'TickAllSnapshot', $groups, $members)
				->setTitle("<em>All snapshot permissions</em>")
				->addExtraClass('tickall')
				->setDescription('UI shortcut to select all snapshot-related options - not written to the database.'),

			// The Main.CanRestoreMembers
			$this
				->buildPermissionField('CanRestoreGroups', 'CanRestoreMembers', $groups, $members)
				->setTitle('Who can restore?')
				->setDescription('Groups or Users who can restore archives from Deploynaut into this environment'),

			// The Main.CanBackupMembers
			$this
				->buildPermissionField('CanBackupGroups', 'CanBackupMembers', $groups, $members)
				->setTitle('Who can backup?')
				->setDescription('Groups or Users who can backup archives from this environment into Deploynaut'),

			// The Main.ArchiveDeleters
			$this
				->buildPermissionField('ArchiveDeleterGroups', 'ArchiveDeleters', $groups, $members)
				->setTitle('Who can delete?')
				->setDescription("Groups or Users who can delete archives from this environment's staging area."),

			// The Main.ArchiveUploaders
			$this
				->buildPermissionField('ArchiveUploaderGroups', 'ArchiveUploaders', $groups, $members)
				->setTitle('Who can upload?')
				->setDescription(
					'Users who can upload archives linked to this environment into Deploynaut.<br />' .
					'Linking them to an environment allows limiting download permissions (see below).'
				),

			// The Main.ArchiveDownloaders
			$this
				->buildPermissionField('ArchiveDownloaderGroups', 'ArchiveDownloaders', $groups, $members)
				->setTitle('Who can download?')
				->setDescription(<<<PHP
Users who can download archives from this environment to their computer.<br />
Since this implies access to the snapshot, it is also a prerequisite for restores
to other environments, alongside the "Who can restore" permission.<br>
Should include all users with upload permissions, otherwise they can't download
their own uploads.
PHP
				)

		));

		// The Main.DeployConfig
		if($this->Project()->exists()) {
			$this->setDeployConfigurationFields($fields);
		}

		// The DataArchives
		$dataArchiveConfig = GridFieldConfig_RecordViewer::create();
		$dataArchiveConfig->removeComponentsByType('GridFieldAddNewButton');
		if(class_exists('GridFieldBulkManager')) {
			$dataArchiveConfig->addComponent(new GridFieldBulkManager());
		}
		$dataArchive = GridField::create('DataArchives', 'Data Archives', $this->DataArchives(), $dataArchiveConfig);
		$fields->addFieldToTab('Root.DataArchive', $dataArchive);

		// Deployments
		$deploymentsConfig = GridFieldConfig_RecordEditor::create();
		$deploymentsConfig->removeComponentsByType('GridFieldAddNewButton');
		if(class_exists('GridFieldBulkManager')) {
			$deploymentsConfig->addComponent(new GridFieldBulkManager());
		}
		$deployments = GridField::create('Deployments', 'Deployments', $this->Deployments(), $deploymentsConfig);
		$fields->addFieldToTab('Root.Deployments', $deployments);

		Requirements::javascript('deploynaut/javascript/environment.js');

		// Add actions
		$action = new FormAction('check', 'Check Connection');
		$action->setUseButtonTag(true);
		$dataURL = Director::absoluteBaseURL() . 'naut/api/' . $this->Project()->Name . '/' . $this->Name . '/ping';
		$action->setAttribute('data-url', $dataURL);
		$fields->insertBefore($action, 'Name');

		// Allow extensions
		$this->extend('updateCMSFields', $fields);
		return $fields;
	}

	/**
	 * @param FieldList $fields
	 */
	protected function setDeployConfigurationFields(&$fields) {
		if(!$this->config()->get('allow_web_editing')) {
			return;
		}

		if($this->envFileExists()) {
			$deployConfig = new TextareaField('DeployConfig', 'Deploy config', $this->getEnvironmentConfig());
			$deployConfig->setRows(40);
			$fields->insertAfter($deployConfig, 'Filename');
			return;
		}

		$warning = 'Warning: This environment doesn\'t have deployment configuration.';
		$noDeployConfig = new LabelField('noDeployConfig', $warning);
		$noDeployConfig->addExtraClass('message warning');
		$fields->insertAfter($noDeployConfig, 'Filename');
		$createConfigField = new CheckboxField('CreateEnvConfig', 'Create Config');
		$createConfigField->setDescription('Would you like to create the capistrano deploy configuration?');
		$fields->insertAfter($createConfigField, 'noDeployConfig');
	}

	/**
	 */
	public function onBeforeWrite() {
		parent::onBeforeWrite();
		if($this->Name && $this->Name . '.rb' != $this->Filename) {
			$this->Filename = $this->Name . '.rb';
		}
		$this->checkEnvironmentPath();
		$this->writeConfigFile();
	}

	public function onAfterWrite() {
		parent::onAfterWrite();

		if($this->Usage == 'Production' || $this->Usage == 'UAT') {
			$conflicting = DNEnvironment::get()
				->filter('ProjectID', $this->ProjectID)
				->filter('Usage', $this->Usage)
				->exclude('ID', $this->ID);

			foreach($conflicting as $otherEnvironment) {
				$otherEnvironment->Usage = 'Unspecified';
				$otherEnvironment->write();
			}
		}
	}


	/**
	 * Ensure that environment paths are setup on the local filesystem
	 */
	protected function checkEnvironmentPath() {
		// Create folder if it doesn't exist
		$configDir = dirname($this->getConfigFilename());
		if(!file_exists($configDir) && $configDir) {
			mkdir($configDir, 0777, true);
		}
	}

	/**
	 * Write the deployment config file to filesystem
	 */
	protected function writeConfigFile() {
		if(!$this->config()->get('allow_web_editing')) {
			return;
		}

		// Create a basic new environment config from a template
		if(!$this->envFileExists()
			&& $this->Filename
			&& $this->CreateEnvConfig
		) {
			$templateFile = $this->config()->template_file ?: BASE_PATH . '/deploynaut/environment.template';
			file_put_contents($this->getConfigFilename(), file_get_contents($templateFile));
		} else if($this->envFileExists() && $this->DeployConfig) {
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

		$create = $this->CreateEnvironment();
		if($create && $create->exists()) {
			$create->delete();
		}
	}

	/**
	 * @return string
	 */
	protected function getEnvironmentConfig() {
		if(!$this->envFileExists()) {
			return '';
		}
		return file_get_contents($this->getConfigFilename());
	}

	/**
	 * @return boolean
	 */
	protected function envFileExists() {
		if(!$this->getConfigFilename()) {
			return false;
		}
		return file_exists($this->getConfigFilename());
	}

	/**
	 * Returns the path to the ruby config file
	 *
	 * @return string
	 */
	public function getConfigFilename() {
		if(!$this->Project()->exists()) {
			return '';
		}
		if(!$this->Filename) {
			return '';
		}
		return $this->DNData()->getEnvironmentDir() . '/' . $this->Project()->Name . '/' . $this->Filename;
	}

	/**
	 * Helper function to convert a multi-dimensional array (associative or indexed) to an {@link ArrayList} or
	 * {@link ArrayData} object structure, so that values can be used in templates.
	 *
	 * @param array $array The (single- or multi-dimensional) array to convert
	 * @return object Either an {@link ArrayList} or {@link ArrayData} object, or the original item ($array) if $array
	 * isn't an array.
	 */
	public static function array_to_viewabledata($array) {
		// Don't transform non-arrays
		if(!is_array($array)) {
			return $array;
		}

		// Figure out whether this is indexed or associative
		$keys = array_keys($array);
		$assoc = ($keys != array_keys($keys));
		if($assoc) {
			// Treat as viewable data
			$data = new ArrayData(array());
			foreach($array as $key => $value) {
				$data->setField($key, self::array_to_viewabledata($value));
			}
			return $data;
		} else {
			// Treat this as basic non-associative list
			$list = new ArrayList();
			foreach($array as $value) {
				$list->push(self::array_to_viewabledata($value));
			}
			return $list;
		}
	}

	/**
	 * Enable the maintenance page
	 *
	 * @param DeploynautLogFile $log
	 */
	public function enableMaintenace($log) {
		$this->Backend()
			->enableMaintenance($this, $log, $this->Project());
	}

	/**
	 * Disable maintenance page
	 *
	 * @param DeploynautLogFile $log
	 */
	public function disableMaintenance($log) {
		$this->Backend()
			->disableMaintenance($this, $log, $this->Project());
	}

	protected function validate() {
		$result = parent::validate();
		$backend = $this->Backend();

		if(strcasecmp('test', $this->Name) === 0 && get_class($backend) == 'CapistranoDeploymentBackend') {
			$result->error('"test" is not a valid environment name when using Capistrano backend.');
		}

		return $result;
	}

	/**
	 * Fetchs all deployments in progress. Limits to 1 hour to prevent deployments
	 * if an old deployment is stuck.
	 *
	 * @return DataList
	 */
	public function runningDeployments() {
		return DNDeployment::get()
			->filter([
				'EnvironmentID' => $this->ID,
				'State' => ['Queued', 'Deploying'],
				'Created:GreaterThan' => strtotime('-1 hour')
			]);
	}

}

