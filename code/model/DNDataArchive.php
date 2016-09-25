<?php
use \Symfony\Component\Process\Process;

/**
 * Represents a file archive of database and/or assets extracted from
 * a specific Deploynaut environment.
 *
 * The model can also represent a request to upload a file later,
 * through offline processes like mailing a DVD. In order to associate
 * and authenticate those requests easily, an upload token is generated for every archive.
 *
 * The "OriginalEnvironment" points to original source of this snapshot
 * (the one it was backed up from). It will be empty if the snapshot has been created with offline process.
 *
 * The "Environment" denotes the ownership of the snapshot. It will be initially set to match the
 * "OriginalEnvironment", but can be changed later. During the offline process the ownership can be set up
 * arbitrarily.
 *
 * When moving snapshots, the file always remains in its initial location.
 *
 * The archive can have associations to {@link DNDataTransfer}:
 * - Zero transfers if a manual upload was requested, but not fulfilled yet
 * - One transfer with Direction=get for a backup from an environment
 * - One or more transfers with Direction=push for a restore to an environment
 *
 * The "Author" is either the person creating the archive through a "backup" operation,
 * the person uploading through a web form, or the person requesting a manual upload.
 *
 * The "Mode" is what the "Author" said the file includes (either 'only assets', 'only
 * database', or both). This is used in the ArchiveList.ss template.
 */
class DNDataArchive extends DataObject {

	private static $db = array(
		'UploadToken' => 'Varchar(8)',
		"Mode" => "Enum('all, assets, db', '')",
		"IsBackup" => "Boolean",
		"IsManualUpload" => "Boolean",
	);

	private static $has_one = array(
		'Author' => 'Member',
		'OriginalEnvironment' => 'DNEnvironment',
		'Environment' => 'DNEnvironment',
		'ArchiveFile' => 'File'
	);

	private static $has_many = array(
		'DataTransfers' => 'DNDataTransfer',
	);

	private static $singular_name = 'Data Archive';

	private static $plural_name = 'Data Archives';

	private static $summary_fields = array(
		'Created' => 'Created',
		'Author.Title' => 'Author',
		'Environment.Project.Name' => 'Project',
		'OriginalEnvironment.Name' => 'Origin',
		'Environment.Name' => 'Environment',
		'ArchiveFile.Name' => 'File',
	);

	private static $searchable_fields = array(
		'Environment.Project.Name' => array(
			'title' => 'Project',
		),
		'OriginalEnvironment.Name' => array(
			'title' => 'Origin',
		),
		'Environment.Name' => array(
			'title' => 'Environment',
		),
		'UploadToken' => array(
			'title' => 'Upload Token',
		),
		'Mode' => array(
			'title' => 'Mode',
		),
	);

	private static $_cache_can_restore = array();

	private static $_cache_can_download = array();

	public static function get_mode_map() {
		return array(
			'all' => 'Database and Assets',
			'db' => 'Database only',
			'assets' => 'Assets only',
		);
	}

	/**
	 * Returns a unique token to correlate an offline item (posted DVD)
	 * with a specific archive placeholder.
	 *
	 * @return String
	 */
	public static function generate_upload_token($chars = 8) {
		$generator = new RandomGenerator();
		return strtoupper(substr($generator->randomToken(), 0, $chars));
	}

	public function onBeforeWrite() {
		if(!$this->AuthorID) {
			$this->AuthorID = Member::currentUserID();
		}

		parent::onBeforeWrite();
	}

	public function onAfterDelete() {
		$this->ArchiveFile()->delete();
	}

	public function getCMSFields() {
		$fields = parent::getCMSFields();
		$fields->removeByName('OriginalEnvironmentID');
		$fields->removeByName('EnvironmentID');
		$fields->removeByName('ArchiveFile');
		$fields->addFieldsToTab(
			'Root.Main',
			array(
				new ReadonlyField('ProjectName', 'Project', $this->Environment()->Project()->Name),
				new ReadonlyField('OriginalEnvironmentName', 'OriginalEnvironment', $this->OriginalEnvironment()->Name),
				new ReadonlyField('EnvironmentName', 'Environment', $this->Environment()->Name),
				$linkField = new ReadonlyField(
					'DataArchive',
					'Archive File',
					sprintf(
						'<a href="%s">%s</a>',
						$this->ArchiveFile()->AbsoluteURL,
						$this->ArchiveFile()->Filename
					)
				),
				new GridField(
					'DataTransfers',
					'Transfers',
					$this->DataTransfers()
				),
			)
		);
		$linkField->dontEscape = true;
		$fields = $fields->makeReadonly();

		return $fields;
	}

	public function getDefaultSearchContext() {
		$context = parent::getDefaultSearchContext();
		$context->getFields()->dataFieldByName('Mode')->setHasEmptyDefault(true);

		return $context;
	}

	/**
	 * Calculates and returns a human-readable size of this archive file. If the file exists, it will determine
	 * whether to display the output in bytes, kilobytes, megabytes, or gigabytes.
	 *
	 * @return string The human-readable size of this archive file
	 */
	public function FileSize() {
		if($this->ArchiveFile()->exists()) {
			return $this->ArchiveFile()->getSize();
		} else {
			return "N/A";
		}
	}

	public function getModeNice() {
		if($this->Mode == 'all') {
			return 'database and assets';
		} else {
			return $this->Mode;
		}
	}

	/**
	 * Some archives don't have files attached to them yet,
	 * because a file has been posted offline and is waiting to be uploaded
	 * against this "archive placeholder".
	 *
	 * @return boolean
	 */
	public function isPending() {
		return !($this->ArchiveFileID);
	}

	/**
	 * Inferred from both restore and backup permissions.
	 *
	 * @param Member|null $member The {@link Member} object to test against.
	 */
	public function canView($member = null) {
		return ($this->canRestore($member) || $this->canDownload($member));
	}

	/**
	 * Whether a {@link Member} can restore this archive to an environment.
	 * This only needs to be checked *once* per member and environment.
	 *
	 * @param Member|null $member The {@link Member} object to test against.
	 * @return true if $member (or the currently logged in member if null) can upload this archive
	 */
	public function canRestore($member = null) {
		$memberID = $member ? $member->ID : Member::currentUserID();
		if(!$memberID) return false;

		$key = $memberID . '-' . $this->EnvironmentID;
		if(!isset(self::$_cache_can_restore[$key])) {
			self::$_cache_can_restore[$key] = $this->Environment()->canUploadArchive($member);
		}

		return self::$_cache_can_restore[$key];
	}

	/**
	 * Whether a {@link Member} can download this archive to their PC.
	 * This only needs to be checked *once* per member and environment.
	 *
	 * @param Member|null $member The {@link Member} object to test against.
	 * @return true if $member (or the currently logged in member if null) can download this archive
	 */
	public function canDownload($member = null) {
		$memberID = $member ? $member->ID : Member::currentUserID();
		if(!$memberID) return false;

		$key = $memberID . '-' . $this->EnvironmentID;
		if(!isset(self::$_cache_can_download[$key])) {
			self::$_cache_can_download[$key] = $this->Environment()->canDownloadArchive($member);
		}
		return self::$_cache_can_download[$key];
	}

	/**
	 * Whether a {@link Member} can delete this archive from staging area.
	 *
	 * @param Member|null $member The {@link Member} object to test against.
	 * @return true if $member (or the currently logged in member if null) can delete this archive
	 */
	public function canDelete($member = null) {
		return $this->Environment()->canDeleteArchive($member);
	}

	/**
	 * Check if this member can move archive into the environment.
	 *
	 * @param DNEnvironment $targetEnv Environment to check.
	 * @param Member|null $member The {@link Member} object to test against. If null, uses Member::currentMember();
	 *
	 * @return boolean true if $member can upload archives linked to this environment, false if they can't.
	 */
	public function canMoveTo($targetEnv, $member = null) {
		if ($this->Environment()->Project()->ID!=$targetEnv->Project()->ID) {
			// We don't permit moving snapshots between projects at this stage.
			return false;
		}

		if(!$member) $member = Member::currentUser();
		if(!$member) return false; // Must be logged in to check permissions

		// Admin can always move.
		if(Permission::checkMember($member, 'ADMIN')) return true;

		// Checks if the user can actually access the archive.
		if (!$this->canDownload($member)) return false;

		// Hooks into ArchiveUploaders permission to prevent proliferation of permission checkboxes.
		// Bypasses the quota check - we don't need to check for it as long as we move the snapshot within the project.
		return $targetEnv->ArchiveUploaders()->byID($member->ID)
			|| $member->inGroups($targetEnv->ArchiveUploaderGroups());
	}

	/**
	 * Finds all environments within this project where the archive can be moved to.
	 * Excludes current environment automatically.
	 *
	 * @return ArrayList List of valid environments.
	 */
	public function validTargetEnvironments() {
		$archive = $this;
		$envs = $this->Environment()->Project()->DNEnvironmentList()
			->filterByCallback(function($item) use ($archive) {
				return $archive->EnvironmentID!=$item->ID && $archive->canMoveTo($item);
			});

		return $envs;
	}

	/**
	 * Returns a unique filename, including project/environment/timestamp details.
	 * @return string
	 */
	public function generateFilename(DNDataTransfer $dataTransfer) {
		$generator = new RandomGenerator();
		$filter = FileNameFilter::create();

		return sprintf(
			'%s-%s-%s-%s-%s',
			$filter->filter(strtolower($this->OriginalEnvironment()->Project()->Name)),
			$filter->filter(strtolower($this->OriginalEnvironment()->Name)),
			$dataTransfer->Mode,
			date('Ymd'),
			sha1($generator->generateEntropy())
		);
	}

	/**
	 * Returns a path unique to a specific transfer, including project/environment details.
	 * Does not create the path on the filesystem. Can be used to store files related to this transfer.
	 *
	 * @param DNDataTransfer
	 * @return String Absolute file path
	 */
	public function generateFilepath(DNDataTransfer $dataTransfer) {
		$data = DNData::inst();
		$transferDir = $data->getDataTransferDir();
		$filter = FileNameFilter::create();

		return sprintf('%s/%s/%s/transfer-%s/',
			$transferDir,
			$filter->filter(strtolower($this->OriginalEnvironment()->Project()->Name)),
			$filter->filter(strtolower($this->OriginalEnvironment()->Name)),
			$dataTransfer->ID
		);
	}

	/**
	 * Attach an sspak file path to this archive and associate the transfer.
	 * Does the job of creating a {@link File} record, and setting correct paths into the assets directory.
	 *
	 * @param string $sspakFilepath
	 * @param DNDataTransfer $dataTransfer
	 * @return bool
	 */
	public function attachFile($sspakFilepath, DNDataTransfer $dataTransfer) {
		$sspakFilepath = ltrim(
			str_replace(
				array(ASSETS_PATH, realpath(ASSETS_PATH)),
				'',
				$sspakFilepath
			),
			DIRECTORY_SEPARATOR
		);

		$folder = Folder::find_or_make(dirname($sspakFilepath));
		$file = new File();
		$file->Name = basename($sspakFilepath);
		$file->Filename = $sspakFilepath;
		$file->ParentID = $folder->ID;
		$file->write();

		// "Status" will be updated by the job execution
		$dataTransfer->write();

		$this->ArchiveFileID = $file->ID;
		$this->DataTransfers()->add($dataTransfer);
		$this->write();

		return true;
	}

	/**
	 * Extract the current sspak contents into the given working directory.
	 * This also extracts the assets and database and puts them into
	 * <workingdir>/database.sql and <workingdir>/assets, respectively.
	 *
	 * @param string|null $workingDir The path to extract to
	 * @throws RuntimeException
	 * @return bool
	 */
	public function extractArchive($workingDir = null) {
		if(!is_dir($workingDir)) {
			mkdir($workingDir, 0700, true);
		}

		$cleanupFn = function() use($workingDir) {
			$process = new Process(sprintf('rm -rf %s', escapeshellarg($workingDir)));
			$process->setTimeout(120);
			$process->run();
		};

		// Extract *.sspak to a temporary location
		$sspakFilename = $this->ArchiveFile()->FullPath;
		$process = new Process(sprintf(
			'tar -xf %s --directory %s',
			escapeshellarg($sspakFilename),
			escapeshellarg($workingDir)
		));
		$process->setTimeout(3600);
		$process->run();
		if(!$process->isSuccessful()) {
			$cleanupFn();
			throw new RuntimeException(sprintf('Could not extract the sspak file: %s', $process->getErrorOutput()));
		}

		// Extract database.sql.gz to <workingdir>/database.sql
		if(file_exists($workingDir . DIRECTORY_SEPARATOR . 'database.sql.gz')) {
			$process = new Process('gunzip database.sql.gz', $workingDir);
			$process->setTimeout(3600);
			$process->run();
			if(!$process->isSuccessful()) {
				$cleanupFn();
				throw new RuntimeException(sprintf('Could not extract the db archive: %s', $process->getErrorOutput()));
			}
		}

		// Extract assets.tar.gz to <workingdir>/assets/
		if(file_exists($workingDir . DIRECTORY_SEPARATOR . 'assets.tar.gz')) {
			$process = new Process('tar xzf assets.tar.gz', $workingDir);
			$process->setTimeout(3600);
			$process->run();
			if(!$process->isSuccessful()) {
				$cleanupFn();
				throw new RuntimeException(sprintf('Could not extract the assets archive: %s', $process->getErrorOutput()));
			}
		}

		return true;
	}

	/**
	 * Validate that an sspak contains the correct content.
	 *
	 * For example, if the user uploaded an sspak containing just the db, but declared in the form
	 * that it contained db+assets, then the archive is not valid.
	 *
	 * @param string $mode "db", "assets", or "all". This is the content we're checking for. Default to the archive setting
	 * @return ValidationResult
	 */
	public function validateArchiveContents($mode = null) {
		$mode = $mode ?: $this->Mode;
		$result = new ValidationResult();

		$file = $this->ArchiveFile()->FullPath;

		if(!is_readable($file)) {
			$result->error(sprintf('SSPak file "%s" cannot be read.', $file));
			return $result;
		}

		$process = new Process(sprintf('tar -tf %s', escapeshellarg($file)));
		$process->setTimeout(120);
		$process->run();
		if(!$process->isSuccessful()) {
			throw new RuntimeException(sprintf('Could not list files in archive: %s', $process->getErrorOutput()));
		}

		$output = explode(PHP_EOL, $process->getOutput());
		$files = array_filter($output);

		if(in_array($mode, array('all', 'db')) && !in_array('database.sql.gz', $files)) {
			$result->error('The snapshot is missing the database.');
			return $result;
		}

		if(in_array($mode, array('all', 'assets')) && !in_array('assets.tar.gz', $files)) {
			$result->error('The snapshot is missing assets.');
			return $result;
		}

		return $result;
	}

	/**
	 * Given a path that already exists and contains an extracted sspak, including
	 * the assets, fix all of the file permissions so they're in a state ready to
	 * be pushed to remote servers.
	 *
	 * Normally, command line tar will use permissions found in the archive, but will
	 * substract the user's umask from them. This has a potential to create unreadable
	 * files, e.g. cygwin on Windows will pack files with mode 000, hence why this fix
	 * is necessary.
	 *
	 * @param string|null $workingDir The path of where the sspak has been extracted to
	 * @throws RuntimeException
	 * @return bool
	 */
	public function fixArchivePermissions($workingDir) {
		$fixCmds = array(
			// The directories need to have permissions changed one by one (hence the ; instead of +),
			// otherwise we might end up having no +x access to a directory deeper down.
			sprintf('find %s -type d -exec chmod 755 {} \;', escapeshellarg($workingDir)),
			sprintf('find %s -type f -exec chmod 644 {} +', escapeshellarg($workingDir))
		);

		foreach($fixCmds as $cmd) {
			$process = new Process($cmd);
			$process->setTimeout(3600);
			$process->run();
			if(!$process->isSuccessful()) {
				throw new RuntimeException($process->getErrorOutput());
			}
		}

		return true;
	}

	/**
	 * Given extracted sspak contents, create an sspak from it
	 * and overwrite the current ArchiveFile with it's contents.
	 * Use GZIP=-1 for less compression on assets, which are already
	 * heavily compressed to begin with.
	 *
	 * @param string|null $workingDir The path of where the sspak has been extracted to
	 * @return bool
	 */
	public function setArchiveFromFiles($workingDir) {
		$commands = array();
		if($this->Mode == 'db') {
			$commands[] = sprintf('tar -cf %s database.sql.gz', $this->ArchiveFile()->FullPath);
			$commands[] = 'rm -f database.sql.gz';
		} elseif($this->Mode == 'assets') {
			$commands[] = 'GZIP=-1 tar --dereference -czf assets.tar.gz assets';
			$commands[] = sprintf('tar -cf %s assets.tar.gz', $this->ArchiveFile()->FullPath);
			$commands[] = 'rm -f assets.tar.gz';
		} else {
			$commands[] = 'GZIP=-1 tar --dereference -czf assets.tar.gz assets';
			$commands[] = sprintf('tar -cf %s database.sql.gz assets.tar.gz', $this->ArchiveFile()->FullPath);
			$commands[] = 'rm -f database.sql.gz assets.tar.gz';
		}

		$process = new Process(implode(' && ', $commands), $workingDir);
		$process->setTimeout(3600);
		$process->run();
		if(!$process->isSuccessful()) {
			throw new RuntimeException($process->getErrorOutput());
		}

		$this->write();

		return true;
	}

}
