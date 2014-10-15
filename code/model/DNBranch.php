<?php

class DNBranch extends ViewableData {

	/**
	 *
	 * @var Gitonomy\Git\Reference\Branch
	 */
	protected $branch = null;

	/**
	 *
	 * @var DNProject
	 */
	protected $project = null;

	/**
	 *
	 * @var DNData
	 */
	protected $data = null;

	private static $casting = array(
		'Name' => 'Text',
		'SHA' => 'Text'
	);

	/**
	 *
	 * @param Gitonomy\Git\Commit $commit
	 * @param DNProject $project
	 * @param DNData $data
	 */
	public function __construct(Gitonomy\Git\Reference\Branch $branch, DNProject $project, DNData $data) {
		$this->branch = $branch;
		$this->project = $project;
		$this->data = $data;
	}

	public function __toString() {
		return $this->Name();
	}

	/**
	 *
	 * @return string
	 */
	public function Name() {
		return (string)htmlentities($this->branch->getName());
	}

	public function Link() {
		// Use a get-var for branch so that it can handle unsafe chars better
		return Controller::join_links($this->project->Link(), 'branch?name='.urlencode($this->Name()));
	}

	/**
	 *
	 * @return string
	 */
	public function SHA() {
		return (string)htmlentities($this->branch->getCommit()->getHash());
	}

	/**
	 * Provides a DNBuildList of builds found in this project.
	 */
	public function DNBuildList() {
		$blockBranch = $this->branch->getName() == 'master' ? null : 'master';
		return DNReferenceList::create($this->project, $this->data, $this->branch, $blockBranch);
	}

	/**
	 *
	 * @return SS_Datetime
	 */
	public function LastUpdated() {
		$created = $this->branch->getCommit()->getCommitterDate();
		// gitonomy sets the time to UTC, so now we set the timezone to
		// whatever PHP is set to (date.timezone). This will change in the future if each
		// deploynaut user has their own timezone
		$created->setTimezone(new DateTimeZone(date_default_timezone_get()));

		$d = new SS_Datetime();
		$d->setValue($created->format('Y-m-d H:i:s'));
		return $d;
	}

	/**
	 *
	 * @return string
	 */
	public function IsOpenByDefault() {
		if($this->Name() == 'master') return " open";
		else return "";
	}

}
