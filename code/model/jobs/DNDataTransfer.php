<?php

/**
 * Class representing a single data transfer in a project,
 * which can include a database export, an archive of all assets, or both.
 *
 * It can be one of two directions:
 * - Backup: Package up data on an environment and store it in a local file
 * - Restore: Transfer data from a local file into an environment, extract assets and/or restore a database
 *
 * The choice of database and/or assets is represented in the "Mode".
 * There's always one file archive involved (stored as the has_one "ArchiveFile") on the local Deploynaut environment.
 *
 * Each transfer is executed by a Resque job, so the model also contains
 * a reference to a Resque token (which might still be in progress).
 *
 * The "Environment" points to the source or target involved.
 *
 * @property string $ResqueToken
 * @property string $Status
 * @property string $Direction
 * @property string $Mode
 * @property string $Origin
 *
 * @method DNEnvironment Environment()
 * @property int EnvironmentID
 * @method Member Author()
 * @property int AuthorID
 * @method DNDataArchive DataArchive()
 * @property int DataArchiveID
 * @method DNDataTransfer BackupDataTransfer()
 * @property int BackupDataTransferID
 */
class DNDataTransfer extends DataObject {

	private static $db = array(
		"ResqueToken" => "Varchar(255)",
		// Observe that this is not the same as Resque status, since ResqueStatus is not persistent.
		"Status" => "Enum('Queued, Started, Finished, Failed, n/a', 'n/a')",
		"Direction" => "Enum('get, push', 'get')",
		"Mode" => "Enum('all, assets, db', '')",
		"Origin" => "Enum('EnvironmentTransfer,ManualUpload', 'EnvironmentTransfer')",
	);

	private static $has_one = array(
		"Environment" => "DNEnvironment",
		"Author" => "Member",
		"DataArchive" => "DNDataArchive",
		"BackupDataTransfer" => "DNDataTransfer" // denotes an automated backup done for a push of this data transfer
	);

	private static $singular_name = 'Data Transfer';

	private static $plural_name = 'Data Transfers';

	private static $summary_fields = array(
		'Created' => 'Created',
		'Author.Title' => 'Author',
		'Environment.Project.Name' => 'Project',
		'Environment.Name' => 'Environment',
		'Status' => 'Status',
		'Origin' => 'Origin',
	);

	private static $searchable_fields = array(
		'Environment.Project.Name' => array(
			'title' => 'Project',
		),
		'Environment.Name' => array(
			'title' => 'Environment',
		),
		'Status' => array(
			'title' => 'Status',
		),
		'Origin' => array(
			'title' => 'Origin',
		),
		'Mode' => array(
			'title' => 'Mode',
		),
		'Direction' => array(
			'title' => 'Direction',
		),
	);

	/**
	 * @param int $int
	 * @return string
	 */
	public static function map_resque_status($int) {
		$remap = array(
			Resque_Job_Status::STATUS_WAITING => "Queued",
			Resque_Job_Status::STATUS_RUNNING => "Running",
			Resque_Job_Status::STATUS_FAILED => "Failed",
			Resque_Job_Status::STATUS_COMPLETE => "Complete",
			false => "Invalid",
		);
		return $remap[$int];
	}

	public function getTitle() {
		return $this->dbObject('Created')->Nice() . " (Status: {$this->Status})";
	}

	public function Link() {
		return Controller::join_links($this->Environment()->Project()->Link(), 'transfer', $this->ID);
	}

	public function LogLink() {
		return Controller::join_links($this->Link(), 'log');
	}

	public function getDefaultSearchContext() {
		$context = parent::getDefaultSearchContext();
		$context->getFields()->dataFieldByName('Status')->setHasEmptyDefault(true);
		$context->getFields()->dataFieldByName('Origin')->setHasEmptyDefault(true);

		return $context;
	}

	public function getCMSFields() {
		$fields = parent::getCMSFields();
		$fields->removeByName('EnvironmentID');
		$fields->removeByName('ArchiveFile');
		$fields->addFieldsToTab(
			'Root.Main',
			array(
				new ReadonlyField('ProjectName', 'Project', $this->Environment()->Project()->Name),
				new ReadonlyField('EnvironmentName', 'Environment', $this->Environment()->Name),
				new ReadonlyField(
					'DataArchive',
					'Archive File',
					sprintf(
						'<a href="%s">%s</a>',
						$this->DataArchive()->ArchiveFile()->AbsoluteURL,
						$this->DataArchive()->ArchiveFile()->Filename
					)
				),
			)
		);
		$fields = $fields->makeReadonly();

		return $fields;
	}

	/**
	 * Queue a transfer job
	 */
	public function start() {
		$env = $this->Environment();
		$log = $this->log();

		$args = array(
			'dataTransferID' => $this->ID,
			'logfile' => $this->logfile()
		);

		if(!$this->AuthorID) {
			$this->AuthorID = Member::currentUserID();
		}

		if($this->AuthorID) {
			$author = $this->Author();
			$message = sprintf(
				'Data transfer on %s (%s, %s) initiated by %s (%s), with IP address %s',
				$env->getFullName(),
				$this->Direction,
				$this->Mode,
				$author->getName(),
				$author->Email,
				Controller::curr()->getRequest()->getIP()
			);
			$log->write($message);
		}

		$token = Resque::enqueue('snapshot', 'DataTransferJob', $args, true);
		$this->ResqueToken = $token;
		$this->write();

		$message = sprintf('Data transfer queued as job %s', $token);
		$log->write($message);
	}

	/**
	 * @param Member|null $member
	 * @return bool
	 */
	public function canView($member = null) {
		return $this->Environment()->canView($member);
	}

	/**
	 * Return a path to the log file.
	 * @return string
	 */
	protected function logfile() {
		return sprintf(
			'%s.datatransfer.%s.log',
			$this->Environment()->getFullName('.'),
			$this->ID
		);
	}

	/**
	 * @return \DeploynautLogFile
	 */
	public function log() {
		return new DeploynautLogFile($this->logfile());
	}

	/**
	 * @return string
	 */
	public function LogContent() {
		return $this->log()->content();
	}

	public function getDescription() {
		$envName = $this->Environment()->getFullName();
		if($this->Direction == 'get') {
			if($this->Origin == 'ManualUpload') {
				$description = 'Manual upload of ' . $this->getModeNice() . ' to ' . $envName;
			} elseif($this->IsBackupDataTransfer()) {
				$description = 'Automated backup of ' . $this->getModeNice() . ' from ' . $envName;
			} else {
				$description = 'Backup of ' . $this->getModeNice() . ' to ' . $envName;
			}
		} else {
			$description = 'Restore ' . $this->getModeNice() . ' to ' . $envName;
		}

		return $description;
	}

	public function getModeNice() {
		if($this->Mode == 'all') {
			return 'database and assets';
		} else {
			return $this->Mode;
		}
	}

	/**
	 * Is this transfer an automated backup of a push transfer?
	 * @return boolean
	 */
	public function IsBackupDataTransfer() {
		return DB::query(sprintf(
			'SELECT COUNT("ID") FROM "DNDataTransfer" WHERE "BackupDataTransferID" = %d',
			$this->ID
		))->value();
	}

	/**
	 * Returns the status of the resque job
	 *
	 * @return string
	 */
	public function ResqueStatus() {
		$status = new Resque_Job_Status($this->ResqueToken);
		$statusCode = $status->get();
		// The Resque job can no longer be found, fallback to the DNDataTransfer.Status
		if($statusCode === false) {
			// Translate from the DNDataTransfer.Status to the Resque job status for UI purposes
			switch($this->Status) {
				case 'Finished':
					return 'Complete';
				case 'Started':
					return 'Running';
				default:
					return $this->Status;
			}
		}
		return self::map_resque_status($statusCode);
	}

}
