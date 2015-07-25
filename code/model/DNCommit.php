<?php
class DNCommit extends ViewableData {

	/**
	 *
	 * @var Gitonomy\Git\Commit
	 */
	protected $commit = null;

	protected $name = null;

	protected $references = null;

	protected $ownerBranchName = null;

	private static $casting = array(
		'Name' => 'Text',
		'SubjectMessage' => 'Text',
		'Message' => 'Text',
		'BodyMessage' => 'Text',
		'Fullname' => 'Text',
		'Filename' => 'Text',
		'References' => 'Text',
		'ownerBranchName' => 'Text'
	);

	/**
	 *
	 * @param Gitonomy\Git\Commit $commit
	 * @param DNProject $project
	 * @param DNData $data
	 */
	public function __construct(Gitonomy\Git\Commit $commit, DNProject $project, DNData $data, $ownerBranchName = null) {
		$this->commit = $commit;
		$this->buildname = $commit->getHash();
		$this->project = $project;
		$this->data = $data;
		$this->ownerBranchName = $ownerBranchName;
	}

	/**
	 * Return the hash of the commit, used to name this commit.
	 * @return string
	 */
	public function Name() {
		if($this->name == null) {
			$this->name = $this->commit->getFixedShortHash(8);
		}

		return htmlentities($this->name);
	}

	/**
	 * Return the first line of the commit message.
	 * @return string
	 */
	public function SubjectMessage() {
		if($this->subjectMessage == null) {
			$this->subjectMessage = $this->commit->getSubjectMessage();
		}

		return htmlentities($this->subjectMessage);
	}

	public function BodyMessage() {
		if($this->bodyMessage == null) {
			$this->bodyMessage = $this->commit->getBodyMessage();
		}

		return htmlentities($this->bodyMessage);
	}

	/**
	 *
	 * @return ArrayList
	 */
	public function References() {
		if($this->references !== null ) {
			return $this->references;
		}
		$this->references = new ArrayList();

		// Add tags
		foreach($this->commit->resolveReferences() as $reference) {
			if($reference instanceof \Gitonomy\Git\Reference\Tag) {
				$this->references->push(new ArrayData(array(
					'Name' => $reference->getName(),
					'Type' => 'Tag',
				)));
			}
		}

		return $this->references;
	}

	/**
	 *
	 * @return string
	 */
	public function FullName() {
		return htmlentities($this->commit->getHash());
	}

	/**
	 *
	 * @return string
	 */
	public function Filename() {
		return htmlentities($this->commit->getHash());
	}

	/**
	 *
	 * @return ArrayList
	 */
	public function CurrentlyDeployedTo() {
		$environments = $this->project->Environments();
		$envList = new ArrayList();
		foreach($environments as $environment) {
			$deployments = DNDeployment::get()
				->filter('Status', 'Finished')
				->filter('EnvironmentID', $environment->ID)
				->sort('LastEdited DESC');
			if(!$deployments->count()) {
				continue;
			}
			$latest = $deployments->first();
			if($latest->SHA === $this->commit->getHash()) {
				$envList->push($environment);
			}
		}
		return $envList;
	}

	/**
	 *
	 * @param string $environmentName
	 * @return boolean True if this release has ever been deployed to the given environment
	 */
	public function EverDeployedTo($environmentName) {
		$environments = $this->project->Environments()->filter('Name', $environmentName);
		if(!$environments->count()) {
			return false;
		}

		$environment = $environments->first();

		$deployments = DNDeployment::get()
				->filter('Status', 'Finished')
				->filter('EnvironmentID', $environment->ID);

		if($deployments->count()) {
			return true;
		}

		return false;
	}

	/**
	 *
	 * @return SS_Datetime
	 */
	public function Created() {
		$created = $this->commit->getCommitterDate();

		// gitonomy sets the time to UTC, so now we set the timezone to
		// whatever PHP is set to (date.timezone). This will change in the future if each
		// deploynaut user has their own timezone
		$created->setTimezone(new DateTimeZone(date_default_timezone_get()));

		$d = new SS_Datetime();
		$d->setValue($created->format('Y-m-d H:i:s'));

		return $d;
	}

}
