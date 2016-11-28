<?php

/**
 * Class representing a single deplyoment (passed or failed) at a time to a particular environment
 *
 * @property string $SHA
 * @property string $ResqueToken
 * @property string $State
 * @property int $RefType
 * @property string $RefName
 * @property SS_Datetime $DeployStarted
 * @property SS_Datetime $DeployRequested
 *
 * @method DNEnvironment Environment()
 * @property int EnvironmentID
 * @method Member Deployer()
 * @property int DeployerID
 */
class DNDeployment extends DataObject implements Finite\StatefulInterface, HasStateMachine {

	const STATE_NEW = 'New';
	const STATE_SUBMITTED = 'Submitted';
	const STATE_INVALID = 'Invalid';
	const STATE_APPROVED = 'Approved';
	const STATE_REJECTED = 'Rejected';
	const STATE_QUEUED = 'Queued';
	const STATE_DEPLOYING = 'Deploying';
	const STATE_ABORTING = 'Aborting';
	const STATE_COMPLETED = 'Completed';
	const STATE_FAILED = 'Failed';
	// Deleted is used as 'soft-delete' which will in all regards keep the record in the DB
	// but not display it in the UI. This is for auditing and also for UI history updates
	const STATE_DELETED = 'Deleted';

	const TR_NEW = 'new';
	const TR_SUBMIT = 'submit';
	const TR_INVALIDATE = 'invalidate';
	const TR_APPROVE = 'approve';
	const TR_REJECT = 'reject';
	const TR_QUEUE = 'queue';
	const TR_DEPLOY = 'deploy';
	const TR_ABORT = 'abort';
	const TR_COMPLETE = 'complete';
	const TR_FAIL = 'fail';
	const TR_DELETE = 'delete';

	/**
	 * @var array
	 */
	private static $db = array(
		"SHA" => "GitSHA",
		"ResqueToken" => "Varchar(255)",
		// is it a branch, tag etc, see GitDispatcher REF_TYPE_* constants
		"RefType" => "Int",
		// The ref name that was used to deploy this, e.g. branch name or tag.
		// Can't really be inferred from Git history because the commit could appear in lots of
		// branches/tags that are irrelevant to the user when it comes to deployment history, and the reference
		// may have been deleted.
		"RefName" => "Varchar(255)",
		"State" => "Enum('New, Submitted, Invalid, Approved, Rejected, Queued, Deploying, Aborting, Completed, Failed, Deleted', 'New')",
		// JSON serialised DeploymentStrategy.
		"Strategy" => "Text",
		"Title" => "Varchar(255)",
		"Summary" => "Text",
		// the date and time the deploy was queued
		"DeployStarted" => "SS_Datetime",
		// the date and time a deployment was requested to be approved
		"DeployRequested" => "SS_Datetime",
		"RejectedReason" => "Text"
	);

	/**
	 * @var array
	 */
	private static $has_one = array(
		"Environment" => "DNEnvironment",
		"Deployer" => "Member",
		"Approver" => "Member",
		"BackupDataTransfer" => "DNDataTransfer" // denotes an automated backup done for this deployment
	);

	private static $default_sort = '"LastEdited" DESC';

	private static $dependencies = [
		'stateMachineFactory' => '%$StateMachineFactory'
	];

	private static $summary_fields = array(
		'LastEdited' => 'Last Edited',
		'SHA' => 'SHA',
		'State' => 'State',
		'Deployer.Name' => 'Deployer'
	);

	public function setResqueToken($token) {
		$this->ResqueToken = $token;
	}

	public function getFiniteState() {
		return $this->State;
	}

	public function setFiniteState($state) {
		$this->State = $state;
		$this->write();
	}

	public function getStatus() {
		return $this->State;
	}

	public function getMachine() {
		return $this->stateMachineFactory->forDNDeployment($this);
	}

	public function Link() {
		if ($this->Environment()->IsNewDeployEnabled()) {
			return \Controller::join_links($this->Environment()->Link(\EnvironmentOverview::ACTION_OVERVIEW), 'deployment', $this->ID);
		} else {
			return \Controller::join_links($this->Environment()->Link(), 'deploy', $this->ID);
		}
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
	 * This remains here for backwards compatibility - we don't want to expose Resque status in here.
	 * Resque job (DeployJob) will change statuses as part of its execution.
	 *
	 * @return string
	 */
	public function ResqueStatus() {
		return $this->State;
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
				return $this->Environment()->getCommit($this->SHA);
			} catch(Gitonomy\Git\Exception\ReferenceNotFoundException $ex) {
				return null;
			}
		}

		return null;
	}

	/**
	 * Get the commit URL to the commit associated with this deployment.
	 * @return null|string
	 */
	public function getCommitURL() {
		$environment = $this->Environment();
		if (!$environment) {
			return null;
		}
		$project = $environment->Project();
		if (!$project) {
			return null;
		}
		$interface = $project->getRepositoryInterface();
		if (!$interface) {
			return null;
		}
		return $interface->CommitURL . '/' . $this->SHA;
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
				return Convert::raw2xml($this->Environment()->getCommitMessage($commit));
			} catch(Gitonomy\Git\Exception\ReferenceNotFoundException $e) {
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
	public function getCommitSubjectMessage() {
		$commit = $this->getCommit();
		if($commit) {
			try {
				return Convert::raw2xml($this->Environment()->getCommitSubjectMessage($commit));
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
		$commit = $this->Environment()->getCommit($this->SHA);
		if(!$commit) {
			return new ArrayList([]);
		}
		$tags = $this->Environment()->getCommitTags($commit);
		$returnTags = [];
		if (!empty($tags)) {
			foreach($tags as $tag) {
				$field = Varchar::create('Tag', '255');
				$field->setValue($tag->getName());
				$returnTags[] = $field;
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
	 * Return a list of things that are going to be deployed, such
	 * as the code version, and any infrastructural changes.
	 *
	 * @return ArrayList
	 */
	public function getChanges() {
		$list = new ArrayList();
		$strategy = $this->getDeploymentStrategy();
		foreach($strategy->getChanges() as $name => $change) {
			$changed = (isset($change['from']) && isset($change['to'])) ? $change['from'] != $change['to'] : null;
			$description = isset($change['description']) ? $change['description'] : '';
			$compareUrl = null;

			// if there is a compare URL, and a description or a change (something actually changed)
			// then show the URL. Otherwise don't show anything, as there is no comparison to be made.
			if ($changed || $description) {
				$compareUrl = isset($change['compareUrl']) ? $change['compareUrl'] : '';
			}

			$list->push(new ArrayData([
				'Name' => $name,
				'From' => isset($change['from']) ? $change['from'] : null,
				'To' => isset($change['to']) ? $change['to'] : null,
				'Description' => $description,
				'Changed' => $changed,
				'CompareUrl' => $compareUrl
			]));
		}

		return $list;
	}

	/**
	 * Start a resque job for this deployment
	 *
	 * @return string Resque token
	 */
	public function enqueueDeployment() {
		$environment = $this->Environment();
		$project = $environment->Project();
		$log = $this->log();

		$args = array(
			'environmentName' => $environment->Name,
			'repository' => $project->getLocalCVSPath(),
			'logfile' => $this->logfile(),
			'projectName' => $project->Name,
			'env' => $project->getProcessEnv(),
			'deploymentID' => $this->ID,
			'sigFile' => $this->getSigFile(),
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
				\Controller::curr()->getRequest()->getIP()
			);
			$log->write($message);
		}

		return Resque::enqueue('deploy', 'DeployJob', $args, true);
	}

	public function getSigFile() {
		$dir = DNData::inst()->getSignalDir();
		if (!is_dir($dir)) {
			`mkdir $dir`;
		}
		return sprintf(
			'%s/deploynaut-signal-%s-%s',
			DNData::inst()->getSignalDir(),
			$this->ClassName,
			$this->ID
		);
	}

	/**
	 * Signal the worker to self-abort. If we had a reliable way of figuring out the right PID,
	 * we could posix_kill directly, but Resque seems to not provide a way to find out the PID
	 * from the job nor worker.
	 */
	public function setSignal($signal) {
		$sigFile = $this->getSigFile();
		// 2 is SIGINT - we can't use SIGINT constant in the Apache context, only available in workers.
		file_put_contents($sigFile, $signal);
	}
}
