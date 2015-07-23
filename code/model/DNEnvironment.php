<?php

/**
 * DNEnvironment
 *
 * This dataobject represents a target environment that source code can be deployed to.
 * Permissions are controlled by environment, see the various many-many relationships.
 *
 * @property string $URL URL Of this environment
 * @property string $Name
 * @property string $GraphiteServers
 * @property bool $DryRunEnabled
 * @method DNProject Project()
 * @method DataList Deployments()
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
 * @method ManyManyList PipelineApprovers()
 * @method ManyManyList PipelineApproverGroups()
 * @method ManyManyList PipelineCancellers()
 * @method ManyManyList PipelineCancellerGroups()
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
	private static $casting = array(
		'DeployHistory' => 'Text'
	);

	/**
	 * Allowed backends. A map of Injector identifier to human-readable label.
	 * @config
	 */
	private static $allowed_backends = array();

	/**
	 *
	 * @var array
	 */
	public static $db = array(
		"Filename" => "Varchar(255)",
		"Name" => "Varchar(255)",
		"URL" => "Varchar(255)",
		"BackendIdentifier" => "Varchar(255)", // Injector identifier of the DeploymentBackend
		"DryRunEnabled" => "Boolean" // True if the dry run button should be enabled on the frontend
	);

	/**
	 *
	 * @var array
	 */
	public static $has_one = array(
		"Project" => "DNProject"
	);

	/**
	 *
	 * @var array
	 */
	public static $has_many = array(
		"Deployments" => "DNDeployment",
		"DataArchives" => "DNDataArchive",
		"Pipelines" => "Pipeline" // Only one Pipeline can be 'Running' at any one time. @see self::CurrentPipeline().
	);

	/**
	 *
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
		"ArchiveDownloaders" => "Member",  // Who can download archive files from this environment
		"ArchiveDownloaderGroups" => "Group",
		"ArchiveDeleters"    => "Member",  // Who can delete archive files from this environment,
		"ArchiveDeleterGroups" => "Group",
		"PipelineApprovers"  => "Member", // Who can approve / reject pipelines from this environment
		"PipelineApproverGroups" => "Group",
		"PipelineCancellers"   => "Member", // Who can abort pipelines
		"PipelineCancellerGroups" => "Group"
	);

	/**
	 *
	 * @var array
	 */
	public static $summary_fields = array(
		"Name"						=> "Environment Name",
		"URL"						=> "URL",
		"DeployersList"				=> "Can Deploy List",
		"CanRestoreMembersList"		=> "Can Restore List",
		"CanBackupMembersList"		=> "Can Backup List",
		"ArchiveUploadersList"		=> "Can Upload List",
		"ArchiveDownloadersList"	=> "Can Download List",
		"ArchiveDeletersList"		=> "Can Delete List",
		"PipelineApproversList"		=> "Can Approve List",
		"PipelineCancellersList"	=> "Can Cancel List"
	);

	private static $singular_name = 'Capistrano Environment';

	private static $plural_name = 'Capistrano Environments';

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
	 * Enforces compliance with the allowed_backends setting; if the DNEnvironment.BackendIdentifier value is
	 * illegal then that value is ignored.
	 *
	 * @return DeploymentBackend
	 */
	public function Backend() {
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
			if(!in_array($backend, $backends)) $backend = $backends[0];
		}

		return Injector::inst()->get($backend);
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
	 * @return boolean true if there is a pipeline for the current environment.
	 */
	public function HasPipelineSupport() {
		$config = $this->GenericPipelineConfig();
		return $config instanceof ArrayData && isset($config->Steps);
	}

	/**
	 * Returns a {@link Pipeline} object that is linked to this environment, but isn't saved into the database. This
	 * shouldn't be saved into the database unless you plan on starting an actual pipeline.
	 *
	 * @return Pipeline
	 */
	public function GenericPipeline() {
		$pipeline = Pipeline::create();
		$pipeline->EnvironmentID = $this->ID;
		return $pipeline;
	}

	/**
	 * Returns the parsed config, based on a {@link Pipeline} being created for this {@link DNEnvironment}.
	 *
	 * @return ArrayData
	 */
	public function GenericPipelineConfig() {
		$config = $this->loadPipelineConfig();
		if($config) {
			return self::array_to_viewabledata($config);
		}
	}

	/**
	 * Extract pipeline configuration data from the source yml file
	 *
	 * @return array
	 */
	public function loadPipelineConfig() {
		require_once 'thirdparty/spyc/spyc.php';

		$path = $this->getPipelineFilename();
		if(file_exists($path)) {
			return Spyc::YAMLLoad($path);
		}
	}

	/**
	 * Returns the {@link DNEnvironment} object relating to the pipeline config for this environment. The environment
	 * YAML file (e.g. project1-uat.yml; see docs/en/pipelines.md) contains two variable called `DependsOnProject` and
	 * `DependsOnEnvironment` - these are used together to find the {@link DNEnvironment} that this environment should
	 * rely on.
	 */
	public function DependsOnEnvironment() {
		if($this->HasPipelineSupport()) {
			$pipeline = $this->GenericPipeline();
			return $pipeline->getDependentEnvironment();
		}

		return null;
	}

	/**
	 * @return bool true if there is a currently running Pipeline, and false if there isn't
	 */
	public function HasCurrentPipeline() {
		return $this->CurrentPipeline() && $this->CurrentPipeline()->isInDB();
	}

	/**
	 * This can be used to determine if there is a currently running pipeline (there can only be one running per
	 * {@link DNEnvironment} at once), as well as getting the current pipeline to be shown in templates.
	 *
	 * @return Pipeline|null The currently running pipeline, or null if there isn't any.
	 */
	public function CurrentPipeline() {
		return $this->Pipelines()->filter('Status', array('Running', 'Rollback'))->first();
	}

	/**
	 * @return bool true if the current user can cancel a running pipeline
	 */
	public function CanCancelPipeline() {
		// do we have a current pipeline
		if ($this->HasCurrentPipeline()) {
			return $this->CurrentPipeline()->canAbort();
		}
		return false;
	}

	/**
	 * Environments are only viewable by people that can view the environment.
	 *
	 * @param Member $member
	 * @return boolean
	 */
	public function canView($member = null) {
		if(!$member) $member = Member::currentUser();
		if(!$member) return false; // Must be logged in to check permissions

		if(Permission::checkMember($member, 'ADMIN')) return true;

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
	 * @param Member $member
	 * @return boolean
	 */
	public function canDeploy($member = null) {
		if(!$member) $member = Member::currentUser();
		if(!$member) return false; // Must be logged in to check permissions

		if(Permission::checkMember($member, 'ADMIN')) return true;

		return $this->Deployers()->byID($member->ID)
			|| $member->inGroups($this->DeployerGroups());
	}

	/**
	 * Allows only selected {@link Member} objects to restore {@link DNDataArchive} objects into this
	 * {@link DNEnvironment}.
	 *
	 * @param Member|null $member The {@link Member} object to test against. If null, uses Member::currentMember();
	 * @return boolean true if $member can restore, and false if they can't.
	 */
	public function canRestore($member = null) {
		if(!$member) $member = Member::currentUser();
		if(!$member) return false; // Must be logged in to check permissions

		if(Permission::checkMember($member, 'ADMIN')) return true;

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
		if($project->HasDiskQuota() && $project->HasExceededDiskQuota()) return false;

		if(!$member) $member = Member::currentUser();
		if(!$member) return false; // Must be logged in to check permissions

		if(Permission::checkMember($member, 'ADMIN')) return true;

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
		if($project->HasDiskQuota() && $project->HasExceededDiskQuota()) return false;

		if(!$member) $member = Member::currentUser();
		if(!$member) return false; // Must be logged in to check permissions

		if(Permission::checkMember($member, 'ADMIN')) return true;

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
		if(!$member) $member = Member::currentUser();
		if(!$member) return false; // Must be logged in to check permissions

		if(Permission::checkMember($member, 'ADMIN')) return true;
		return $this->ArchiveDownloaders()->byID($member->ID)
			|| $member->inGroups($this->ArchiveDownloaderGroups());
	}

	/**
	 * Determine if the specified user can abort any pipelines
	 *
	 * @param type $member
	 * @return boolean
	 */
	public function canAbort($member = null) {
		if(!$member) $member = Member::currentUser();
		if(!$member) return false;

		if(Permission::checkMember($member, 'ADMIN')) return true;
		
		return $this->PipelineCancellers()->byID($member->ID)
			|| $member->inGroups($this->PipelineCancellerGroups());
	}

	/**
	 * Determine if the specified user can approve any pipelines
	 *
	 * @param type $member
	 * @return boolean
	 */
	public function canApprove($member = null) {
		if(!$member) $member = Member::currentUser();
		if(!$member) return false;

		if(Permission::checkMember($member, 'ADMIN')) return true;
		return $this->PipelineApprovers()->byID($member->ID)
			|| $member->inGroups($this->PipelineApproverGroups());
	}

	/**
	 * Allows only selected {@link Member} objects to delete {@link DNDataArchive} objects from this
	 * {@link DNEnvironment}.
	 *
	 * @param Member|null $member The {@link Member} object to test against. If null, uses Member::currentMember();
	 * @return boolean true if $member can delete archives from this environment, false if they can't.
	 */
	public function canDeleteArchive($member = null) {
		if(!$member) $member = Member::currentUser();
		if(!$member) return false; // Must be logged in to check permissions

		if(Permission::checkMember($member, 'ADMIN')) return true;

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
	 * Get a string of groups/people that are allowed to upload {@link DNDataArchive} objects linked to this environment.
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
	 * Get a string of groups/people that are allowed to approve pipelines
	 *
	 * @return string
	 */
	public function getPipelineApproversList() {
		return implode(
			", ",
			array_merge(
				$this->PipelineApproverGroups()->column("Title"),
				$this->PipelineApprovers()->column("FirstName")
			)
		);
	}

	/**
	 * Get a string of groups/people that are allowed to cancel pipelines
	 *
	 * @return string
	 */
	public function getPipelineCancellersList() {
		return implode(
			", ",
			array_merge(
				$this->PipelineCancellerGroups()->column("Title"),
				$this->PipelineCancellers()->column("FirstName")
			)
		);
	}

	/**
	 *
	 * @return DNData
	 */
	public function DNData() {
		return DNData::inst();
	}

	/**
	 * Get the current deployed build for this environment
	 *
	 * Dear people of the future: If you are looking to optimize this, simply create a CurrentBuildSHA(), which can be a lot faster.
	 * I presume you came here because of the Project display template, which only needs a SHA.
	 *
	 * @return string
	 */
	public function CurrentBuild() {
		// The DeployHistory function is far too slow to use for this
		$deploy = DNDeployment::get()->filter(array('EnvironmentID' => $this->ID, 'Status' => 'Finished'))->sort('LastEdited DESC')->first();

		if (!$deploy || (!$deploy->SHA)) {
			return false;
		}

		$repo = $this->Project()->getRepository();
		if (!$repo) {
			return $deploy;
		}

		try {
			$commit = $repo->getCommit($deploy->SHA);
			if ($commit) {
				$deploy->Message = Convert::raw2xml($commit->getMessage());
			}
			// We can't find this SHA, so we ignore adding a commit message to the deployment
		} catch (Gitonomy\Git\Exception\ReferenceNotFoundException $ex) { }

		return $deploy;
	}

	/**
	 * A history of all builds deployed to this environment
	 *
	 * @return ArrayList
	 */
	public function DeployHistory() {
		$history = $this
			->Deployments()
			->sort('LastEdited DESC');
		$repo = $this->Project()->getRepository();
		if(!$repo){
			return $history;
		}

		$ammendedHistory = new ArrayList();
		foreach($history as $deploy) {
			if(!$deploy->SHA) {
				continue;
			}
			try {
				$commit = $repo->getCommit($deploy->SHA);
				if($commit) {
					$deploy->Message = Convert::raw2xml($commit->getMessage());
				}
				// We can't find this SHA, so we ignore adding a commit message to the deployment
			} catch (Gitonomy\Git\Exception\ReferenceNotFoundException $ex) { }
			$ammendedHistory->push($deploy);
		}

		return $ammendedHistory;
	}

	/**
	 *
	 * @param string $sha
	 * @return array
	 */
	protected function getCommitData($sha) {
		try {
			$commit = new \Gitonomy\Git\Commit($this->Project()->getRepository(), $sha);
			return array(
				'AuthorName' => (string)Convert::raw2xml($commit->getAuthorName()),
				'AuthorEmail' => (string)Convert::raw2xml($commit->getAuthorEmail()),
				'Message' => (string)Convert::raw2xml($commit->getMessage()),
				'ShortHash' => Convert::raw2xml($commit->getFixedShortHash(8)),
				'Hash' => Convert::raw2xml($commit->getHash())
			);  
		} catch(\Gitonomy\Git\Exception\ReferenceNotFoundException $exc) {
			return array(
				'AuthorName' => '(unknown)',
				'AuthorEmail' => '(unknown)',
				'Message' => '(unknown)',
				'ShortHash' => $sha,
				'Hash' => '(unknown)',
			);
		}
	}

	/**
	 *
	 * @return string
	 */
	public function Link() {
		return $this->Project()->Link()."/environment/" . $this->Name;
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
	 *
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
				),

			// The Main.PipelineApprovers
			$this
				->buildPermissionField('PipelineApproverGroups', 'PipelineApprovers', $groups, $members)
				->setTitle('Who can approve pipelines?')
				->setDescription('Users who can approve waiting deployment pipelines.'),

			// The Main.PipelineCancellers
			$this
				->buildPermissionField('PipelineCancellerGroups', 'PipelineCancellers', $groups, $members)
				->setTitle('Who can cancel pipelines?')
				->setDescription('Users who can cancel in-progess deployment pipelines.')
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

		// Pipeline templates
		$this->setPipelineConfigurationFields($fields);

		// Pipelines
		if($this->Pipelines()->Count()) {
			$pipelinesConfig = GridFieldConfig_RecordEditor::create();
			$pipelinesConfig->removeComponentsByType('GridFieldAddNewButton');
			if(class_exists('GridFieldBulkManager')) {
				$pipelinesConfig->addComponent(new GridFieldBulkManager());
			}
			$pipelines = GridField::create('Pipelines', 'Pipelines', $this->Pipelines(), $pipelinesConfig);
			$fields->addFieldToTab('Root.Pipelines', $pipelines);
		}

		// Deployments
		$deploymentsConfig = GridFieldConfig_RecordEditor::create();
		$deploymentsConfig->removeComponentsByType('GridFieldAddNewButton');
		if(class_exists('GridFieldBulkManager')) {
			$deploymentsConfig->addComponent(new GridFieldBulkManager());
		}
		$deployments = GridField::create('Deployments', 'Deployments', $this->Deployments(), $deploymentsConfig);
		$fields->addFieldToTab('Root.Deployments', $deployments);

		// The Extra.GraphiteServers
		$fields->addFieldToTab('Root.GraphiteSettings',
			TextareaField::create('GraphiteServers')
				->setDescription(
					'Enter your graphite servers one by line, e.g. "server.wgtn.test"'
				)
		);

		Requirements::javascript('deploynaut/javascript/environment.js');

		// Add actions
		$action = new FormAction('check', 'Check Connection');
		$action->setUseButtonTag(true);
		$action->setAttribute('data-url', Director::absoluteBaseURL().'naut/api/'.$this->Project()->Name.'/'.$this->Name.'/ping');
		$fields->insertBefore($action, 'Name');

		// Allow extensions
		$this->extend('updateCMSFields', $fields);
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
			$fields->insertAfter($deployConfig, 'Filename');
			return;
		}

		$noDeployConfig = new LabelField('noDeployConfig', 'Warning: This environment doesn\'t have deployment configuration.');
		$noDeployConfig->addExtraClass('message warning');
		$fields->insertAfter($noDeployConfig, 'Filename');
		$createConfigField = new CheckboxField('CreateEnvConfig', 'Create Config');
		$createConfigField->setDescription('Would you like to create the capistrano deploy configuration?');
		$fields->insertAfter($createConfigField, 'noDeployConfig');
	}

	protected function setPipelineConfigurationFields($fields) {
		if(!$this->config()->get('allow_web_editing')) {
			return;
		}
		$config = $this->pipelineFileExists()
			? file_get_contents($this->getPipelineFilename())
			: '';
		$deployConfig = new TextareaField('PipelineConfig', 'Pipeline config', $config);
		$deployConfig->setRows(40);
		if(!$this->pipelineFileExists()) {
			$deployConfig->setDescription(
				"No pipeline is configured for this environment. Saving content here will generate a new template."
			);
		}
		$fields->addFieldsToTab('Root.PipelineSettings', array(
			FieldGroup::create(
				CheckboxField::create('DryRunEnabled', 'Enable dry-run?')
			)
				->setTitle('Pipeline Options')
				->setDescription(
					"Allows admins to run simulated pipelines without triggering deployments or notifications."
				),
			$deployConfig
		));
	}

	/**
	 *
	 */
	public function onBeforeWrite() {
		parent::onBeforeWrite();
		if($this->Name && $this->Name.'.rb' != $this->Filename) {
			$this->Filename = $this->Name.'.rb';
		}
		$this->checkEnvironmentPath();
		$this->writeConfigFile();
		$this->writePipelineFile();
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
		if(!$this->config()->get('allow_web_editing')) return;

		// Create a basic new environment config from a template
		if( !$this->envFileExists()
			&& $this->Filename
			&& $this->CreateEnvConfig
		) {
			$templateFile = $this->config()->template_file ?: BASE_PATH.'/deploynaut/environment.template';
			file_put_contents($this->getConfigFilename(), file_get_contents($templateFile));
		} else if($this->envFileExists() && $this->DeployConfig) {
			file_put_contents($this->getConfigFilename(), $this->DeployConfig);
		}
	}

	/**
	 * Write the pipeline config file to filesystem
	 */
	protected function writePipelineFile() {
		if(!$this->config()->get('allow_web_editing')) return;
		$path = $this->getPipelineFilename();
		if($this->PipelineConfig) {
			// Update file
			file_put_contents($path, $this->PipelineConfig);
		} elseif($this->isChanged('PipelineConfig') && file_exists($path)) {
			// Remove file if deleted
			unlink($path);
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
		return $this->DNData()->getEnvironmentDir().'/'.$this->Project()->Name.'/'.$this->Filename;
	}

	/**
	 * Returns the path to the {@link Pipeline} configuration for this environment.
	 * Uses the same path and filename as the capistrano config, but with .yml extension.
	 *
	 * @return string
	 */
	public function getPipelineFilename() {
		$name = $this->getConfigFilename();
		if(!$name) return null;
		$path = pathinfo($name);
		if($path) return $path['dirname'] . '/' . $path['filename'] . '.yml';
	}

	/**
	 * Does this environment have a pipeline config file
	 *
	 * @return boolean
	 */
	protected function pipelineFileExists() {
		$filename = $this->getPipelineFilename();
		if(empty($filename)) {
			return false;
		}
		return file_exists($filename);
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
		if(!is_array($array)) return $array;

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
			foreach($array as $value){
				$list->push(self::array_to_viewabledata($value));
			}
			return $list;
		}
	}



	/**
	 * Helper function to retrieve filtered commits from an environment
	 * this environment depends on
	 *
	 * @return DataList
	 */
	public function getDependentFilteredCommits() {
		// check if this environment depends on another environemnt
		$dependsOnEnv = $this->DependsOnEnvironment();
		if(empty($dependsOnEnv)) return null;

		// Check if there is a filter
		$config = $this->GenericPipelineConfig();
		$filter = isset($config->PipelineConfig->FilteredCommits)
			? $config->PipelineConfig->FilteredCommits
			: null;
		if (empty($filter)) return null;

		// Create and execute filter
		if (!class_exists($filter)) throw new Exception(sprintf("Class %s does not exist", $filter));
		$commitClass = $filter::create();
		// setup the environment to check for commits
		$commitClass->env = $dependsOnEnv;
		return $commitClass->getCommits();
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

		if(strcasecmp('test', $this->Name) === 0) {
			$result->error('"test" is not a valid environment name when using Capistrano backend.');
		}
		
		return $result;
	}

}
