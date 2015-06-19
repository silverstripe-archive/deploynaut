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
		'ArchiveFileHash' => 'Varchar(32)',
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
	 *
	 * @param Member|null $member The {@link Member} object to test against.
	 * @return true if $member (or the currently logged in member if null) can upload this archive
	 */
	public function canRestore($member = null) {
		$key = is_object($member) ? $member->ID : $member;
		if(!isset(self::$_cache_can_restore[$key])) {
			self::$_cache_can_restore[$key] = $this->Environment()->canUploadArchive($member);
		}

		return self::$_cache_can_restore[$key];
	}

	/**
	 * Whether a {@link Member} can download this archive to their PC.
	 *
	 * @param Member|null $member The {@link Member} object to test against.
	 * @return true if $member (or the currently logged in member if null) can download this archive
	 */
	public function canDownload($member = null) {
		$key = is_object($member) ? $member->ID : $member;
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
		$sanitizeRegex = array('/\s+/', '/[^a-zA-Z0-9-_\.]/');
		$sanitizeReplace = array('/_/', '');
		$envName = strtolower(preg_replace($sanitizeRegex, $sanitizeReplace, $this->OriginalEnvironment()->Name));
		$projectName = strtolower(preg_replace(
			$sanitizeRegex,
			$sanitizeReplace,
			$this->OriginalEnvironment()->Project()->Name
		));

		return sprintf(
			'%s-%s-%s-%s-%s',
			$projectName,
			$envName,
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
		$sanitizeRegex = array('/\s+/', '/[^a-zA-Z0-9-_\.]/');
		$sanitizeReplace = array('/_/', '');
		$projectName = strtolower(preg_replace($sanitizeRegex, $sanitizeReplace, $this->OriginalEnvironment()->Project()->Name));
		$envName = strtolower(preg_replace($sanitizeRegex, $sanitizeReplace, $this->OriginalEnvironment()->Name));
		
		return sprintf('%s/%s/%s/transfer-%s/',
			$transferDir,
			$projectName,
			$envName,
			$dataTransfer->ID
		);
	}

	/**
	 * Inspect the archive and ensure permissions of contained files are correct.
	 *
	 * @param DeploynautLogFile $log
	 * @param string $workingDir Optional: The working directory of where the archive will be
	 *					extracted. Defaults to temp/deploynaut-archive-{ID}
	 * @param string $mode Optional: Defaults to this archive's declared "Mode" field, but useful
	 *					to specify if you want to validate the archive for another mode, such as
	 *					the one from a DNDataTransfer.
	 * @param bool
	 */
	public function validateAndFixArchiveFile(DeploynautLogFile $log, $workingDir = null, $mode = null) {
		$mode = $mode ?: $this->Mode;

		if(!$workingDir) {
			$workingDir = TEMP_FOLDER . DIRECTORY_SEPARATOR . 'deploynaut-archive-' . $this->ID;
		}

		// Rollback cleanup.
		$self = $this;
		$cleanupFn = function() use ($self, $workingDir) {
			$process = new Process('rm -rf ' . escapeshellarg($workingDir));
			$process->run();
		};

		// Create target temp dir.
		mkdir($workingDir, 0700, true);

		// Extract *.sspak to a temporary location
		$log->write('Extracting *.sspak file');
		$sspakFilename = $this->ArchiveFile()->FullPath;
		$sspakCmd = sprintf('sspak extract %s %s', escapeshellarg($sspakFilename), escapeshellarg($workingDir));
		$log->write($sspakCmd);
		$process = new Process($sspakCmd);
		$process->setTimeout(3600);
		$process->run();
		if(!$process->isSuccessful()) {
			$cleanupFn();
			$log->write(sprintf('Could not extract the sspak file: %s', $process->getErrorOutput()));
			return false;
		}

		$this->fixArchivePermissions($workingDir, $log);

		// Make sure the sspak archive contains legitimate data: check for db...
		if(
			in_array($mode, array('all', 'db'))
			&& !is_file($workingDir . DIRECTORY_SEPARATOR . 'database.sql.gz')
		) {
			$cleanupFn();
			$log->write(sprintf('Cannot restore in \'%s\' mode: database dump not found in this sspak.', $mode));
			return false;
		}

		// Database is stored as database.sql.gz. We don't care about the permissions of the database.sql, because
		// it's never unpacked as a file - it's piped directly into mysql in data.rb.

		// ... check for assets.
		if(in_array($mode, array('all', 'assets'))) {
			if(!is_file($workingDir . DIRECTORY_SEPARATOR . 'assets.tar.gz')) {
				$cleanupFn();
				$log->write(sprintf('Cannot restore in \'%s\' mode: asset dump not found in this sspak.', $mode));
				return false;
			}

			// Extract assets.tar.gz into assets/
			$extractCmd = sprintf(
				'cd %s && tar xzf %s',
				escapeshellarg($workingDir),
				escapeshellarg($workingDir . DIRECTORY_SEPARATOR . 'assets.tar.gz')
			);

			$log->write($extractCmd);
			$process = new Process($extractCmd);
			$process->setTimeout(3600);
			$process->run();
			if(!$process->isSuccessful()) {
				$cleanupFn();
				$log->write(sprintf('Could not extract the assets archive: %s', $process->getErrorOutput()));
				return false;
			}

			// Fix permissions again - we have just extracted the assets.tar.gz. This will help with cleanup.
			$this->fixArchivePermissions($workingDir, $log);

			// Check inside the assets.
			if(!is_dir($workingDir . DIRECTORY_SEPARATOR . 'assets')) {
				$cleanupFn();
				$log->write(sprintf('Cannot restore in \'%s\' mode: asset directory not found in asset dump.', $mode));
				return false;
			}
		}

		return true;
	}

	/**
	 * Utility function to recursively fix the permissions to readable-writable for untarred files.
	 * Normally, command line tar will use permissions found in the archive, but will substract the user's umask from
	 * them. This has a potential to create unreadable files e.g. cygwin on Windows will pack files with mode 000.
	 *
	 * @param string $path Root path to fix. Can be a dir or a file.
	 * @param DeploynautLogFile $log Log file to write to.
	 * @return boolean
	 */
	protected function fixArchivePermissions($path, DeploynautLogFile $log) {
		$fixCmds = array(
			// The directories need to have permissions changed one by one (hence the ; instead of +),
			// otherwise we might end up having no +x access to a directory deeper down.
			sprintf('find %s -type d -exec chmod 755 {} \;', escapeshellarg($path)),
			sprintf('find %s -type f -exec chmod 644 {} +', escapeshellarg($path))
		);

		foreach($fixCmds as $cmd) {
			$log->write($cmd);
			$process = new Process($cmd);
			$process->setTimeout(3600);
			$process->run();
			if(!$process->isSuccessful()) {
				$log->write(sprintf('Could not reset permissions on the unpacked files: %s', $process->getErrorOutput()));
				return false;
			}
		}

		return true;
	}

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

}
