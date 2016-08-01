<?php

use Finite\State\StateInterface;

/**
 * Class representing a single deplyoment (passed or failed) at a time to a particular environment
 *
 * @property string $SHA
 * @property string $ResqueToken
 * @property string $State
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
	const STATE_QUEUED = 'Queued';
	const STATE_DEPLOYING = 'Deploying';
	const STATE_ABORTING = 'Aborting';
	const STATE_COMPLETED = 'Completed';
	const STATE_FAILED = 'Failed';

	const TR_SUBMIT = 'submit';
	const TR_INVALIDATE = 'invalidate';
	const TR_QUEUE = 'queue';
	const TR_DEPLOY = 'deploy';
	const TR_ABORT = 'abort';
	const TR_COMPLETE = 'complete';
	const TR_FAIL = 'fail';

	/**
	 * @var array
	 */
	private static $db = array(
		"SHA" => "GitSHA",
		"ResqueToken" => "Varchar(255)",
		// The branch that was used to deploy this. Can't really be inferred from Git history because
		// the commit could appear in lots of branches that are irrelevant to the user when it comes
		// to deployment history, and the branch may have been deleted.
		"Branch" => "Varchar(255)",
		"State" => "Enum('New, Submitted, Invalid, Queued, Deploying, Aborting, Completed, Failed', 'New')",
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
		'State' => 'State',
		'Deployer.Name' => 'Deployer'
	);

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
		$loader = new Finite\Loader\ArrayLoader([
			'class'   => 'DNDeployment',
			'states'  => [
				self::STATE_NEW => ['type' => StateInterface::TYPE_INITIAL],
				self::STATE_SUBMITTED => ['type' => StateInterface::TYPE_NORMAL],
				self::STATE_INVALID => ['type' => StateInterface::TYPE_NORMAL],
				self::STATE_QUEUED => ['type' => StateInterface::TYPE_NORMAL],
				self::STATE_DEPLOYING => ['type' => StateInterface::TYPE_NORMAL],
				self::STATE_ABORTING => ['type' => StateInterface::TYPE_NORMAL],
				self::STATE_COMPLETED => ['type' => StateInterface::TYPE_FINAL],
				self::STATE_FAILED => ['type' => StateInterface::TYPE_FINAL],
			],
			'transitions' => [
				self::TR_SUBMIT => ['from' => [self::STATE_NEW], 'to' => self::STATE_SUBMITTED],
				self::TR_QUEUE => ['from' => [self::STATE_SUBMITTED], 'to' => self::STATE_QUEUED],
				self::TR_INVALIDATE  => [
					'from' => [self::STATE_NEW, self::STATE_SUBMITTED],
					'to' => self::STATE_INVALID
				],
				self::TR_DEPLOY  => ['from' => [self::STATE_QUEUED], 'to' => self::STATE_DEPLOYING],
				self::TR_ABORT => [
					'from' => [
						self::STATE_QUEUED,
						self::STATE_DEPLOYING,
						self::STATE_ABORTING
					],
					'to' => self::STATE_ABORTING
				],
				self::TR_COMPLETE => ['from' => [self::STATE_DEPLOYING], 'to' => self::STATE_COMPLETED],
				self::TR_FAIL  => [
					'from' => [
						self::STATE_NEW,
						self::STATE_SUBMITTED,
						self::STATE_QUEUED,
						self::STATE_INVALID,
						self::STATE_DEPLOYING,
						self::STATE_ABORTING
					],
					'to' => self::STATE_FAILED
				],
			],
			'callbacks' => [
				'after' => [
					['to' => [self::STATE_QUEUED], 'do' => [$this, 'onQueue']],
					['to' => [self::STATE_ABORTING], 'do' => [$this, 'onAbort']],
				]
			]
		]);
		$stateMachine = new Finite\StateMachine\StateMachine($this);
		$loader->load($stateMachine);
		$stateMachine->initialize();
		return $stateMachine;
	}


	public function onQueue() {
		$log = $this->log();
		$token = $this->enqueueDeployment();
		$this->ResqueToken = $token;
		$this->write();

		$message = sprintf('Deploy queued as job %s (sigFile is %s)', $token, DeployJob::sig_file_for_data_object($this));
		$log->write($message);
	}

	public function onAbort() {
		// 2 is SIGINT - we can't use SIGINT constant in the mod_apache context.
		DeployJob::set_signal($this, 2);
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
	 * Return a list of things that are going to be deployed, such
	 * as the code version, and any infrastrucutral changes.
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
			'deploymentID' => $this->ID,
			'sigFile' => DeployJob::sig_file_for_data_object($this)
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
}
