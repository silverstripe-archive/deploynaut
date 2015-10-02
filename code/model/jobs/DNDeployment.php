<?php

/**
 * Class representing a single deplyoment (passed or failed) at a time to a particular environment
 *
 * @property string $SHA
 * @property string $ResqueToken
 * @property string $Status
 *
 * @method DNEnvironment Environment()
 * @property int EnvironmentID
 * @method Member Deployer()
 * @property int DeployerID
 */
class DNDeployment extends DataObject {

	/**
	 * @var array
	 */
	private static $db = array(
		"SHA" => "GitSHA",
		"ResqueToken" => "Varchar(255)",
		// Observe that this is not the same as Resque status, since ResqueStatus is not persistent
		// It's used for finding successful deployments and displaying that in history views in the frontend
		"Status" => "Enum('Queued, Started, Finished, Failed, n/a', 'n/a')",
		// JSON serialised DeploymentStrategy.
		"Strategy" => "Text"
	);

	/**
	 * @var array
	 */
	private static $has_one = array(
		"Environment" => "DNEnvironment",
		"Deployer" => "Member",
	);

	private static $default_sort = '"LastEdited" DESC';

	public function getTitle() {
		return "#{$this->ID}: {$this->SHA} (Status: {$this->Status})";
	}

	private static $summary_fields = array(
		'LastEdited' => 'Last Edited',
		'SHA' => 'SHA',
		'Status' => 'Status',
		'Deployer.Name' => 'Deployer'
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


	public function Link() {
		return Controller::join_links($this->Environment()->Link(), 'deploy', $this->ID);
	}

	public function LogLink() {
		return $this->Link() . '/log';
	}

	public function canView($member = null) {
		return $this->Environment()->canView($member);
	}

	/**
	 * Return a path to the log file.
	 * @return string
	 */
	protected function logfile() {
		return sprintf(
			'%s.%s.log',
			$this->Environment()->getFullName('.'),
			$this->ID
		);
	}

	/**
	 * @return DeploynautLogFile
	 */
	public function log() {
		return Injector::inst()->createWithArgs('DeploynautLogFile', array($this->logfile()));
	}

	public function LogContent() {
		return $this->log()->content();
	}

	/**
	 * Returns the status of the resque job
	 *
	 * @return string
	 */
	public function ResqueStatus() {
		$status = new Resque_Job_Status($this->ResqueToken);
		$statusCode = $status->get();
		// The Resque job can no longer be found, fallback to the DNDeployment.Status
		if($statusCode === false) {
			// Translate from the DNDeployment.Status to the Resque job status for UI purposes
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


	/**
	 * Fetch the git repository
	 *
	 * @return \Gitonomy\Git\Repository|null
	 */
	public function getRepository() {
		if(!$this->SHA) {
			return null;
		}
		return $this->Environment()->Project()->getRepository();
	}


	/**
	 * Gets the commit from source. The result is cached upstream in Repository.
	 *
	 * @return \Gitonomy\Git\Commit|null
	 */
	public function getCommit() {
		$repo = $this->getRepository();
		if($repo) {
			try {
				return $repo->getCommit($this->SHA);
			} catch(Gitonomy\Git\Exception\ReferenceNotFoundException $ex) {
				return null;
			}
		}

		return null;
	}


	/**
	 * Gets the commit message.
	 *
	 * @return string|null
	 */
	public function getCommitMessage() {
		$commit = $this->getCommit();
		if($commit) {
			try {
				return Convert::raw2xml($commit->getMessage());
			} catch(Gitonomy\Git\Exception\ReferenceNotFoundException $e) {
				return null;
			}
		}
		return null;
	}

	/**
	 * Return all tags for the deployed commit.
	 *
	 * @return ArrayList
	 */
	public function getTags() {
		$returnTags = array();
		$repo = $this->getRepository();
		if($repo) {
			$tags = $repo->getReferences()->resolveTags($this->SHA);
			if(!empty($tags)) {
				foreach($tags as $tag) {
					$field = Varchar::create('Tag', '255');
					$field->setValue($tag->getName());
					$returnTags[] = $field;
				}
			}
		}
		return new ArrayList($returnTags);
	}

	/**
	 * Collate the list of additional flags to affix to this deployment.
	 * Elements of the array will be rendered literally.
	 *
	 * @return ArrayList
	 */
	public function getFullDeployMessages() {
		$strategy = $this->getDeploymentStrategy();
		if ($strategy->getActionCode()!=='full') return null;

		$changes = $strategy->getChangesModificationNeeded();
		$messages = [];
		foreach ($changes as $change => $details) {
			if ($change==='Code version') continue;

			$messages[] = [
				'Flag' => sprintf(
					'<span class="label label-default full-deploy-info-item">%s</span>',
					$change[0]
				),
				'Text' => sprintf('%s changed', $change)
			];
		}

		if (empty($messages)) {
			$messages[] = [
				'Flag' => '',
				'Text' => '<i>Environment changes have been made.</i>'
			];
		}

		return new ArrayList($messages);
	}

	/**
	 * Fetches the latest tag for the deployed commit
	 *
	 * @return \Varchar|null
	 */
	public function getTag() {
		$tags = $this->getTags();
		if($tags->count() > 0) {
			return $tags->last();
		}
		return null;
	}

	/**
	 * @return DeploymentStrategy
	 */
	public function getDeploymentStrategy() {
		$environment = $this->Environment();
		$strategy = new DeploymentStrategy($environment);
		$strategy->fromJSON($this->Strategy);
		return $strategy;
	}

	/**
	 * Start a resque job for this deployment
	 *
	 * @return string Resque token
	 */
	protected function enqueueDeployment() {
		$environment = $this->Environment();
		$project = $environment->Project();
		$log = $this->log();

		$args = array(
			'environmentName' => $environment->Name,
			'repository' => $project->getLocalCVSPath(),
			'logfile' => $this->logfile(),
			'projectName' => $project->Name,
			'env' => $project->getProcessEnv(),
			'deploymentID' => $this->ID
		);

		$strategy = $this->getDeploymentStrategy();
		// Inject options.
		$args = array_merge($args, $strategy->getOptions());
		// Make sure we use the SHA as it was written into this DNDeployment.
		$args['sha'] = $this->SHA;

		if(!$this->DeployerID) {
			$this->DeployerID = Member::currentUserID();
		}

		if($this->DeployerID) {
			$deployer = $this->Deployer();
			$message = sprintf(
				'Deploy to %s initiated by %s (%s), with IP address %s',
				$environment->getFullName(),
				$deployer->getName(),
				$deployer->Email,
				Controller::curr()->getRequest()->getIP()
			);
			$log->write($message);
		}

		return Resque::enqueue('deploy', 'DeployJob', $args, true);
	}

	public function start() {
		$log = $this->log();
		$token = $this->enqueueDeployment();
		$this->ResqueToken = $token;
		$this->Status = 'Queued';
		$this->write();

		$message = sprintf('Deploy queued as job %s', $token);
		$log->write($message);
	}
}
