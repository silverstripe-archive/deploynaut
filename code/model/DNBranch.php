<?php

/**
 * Class DNBranch
 *
 * @method string getName()
 */
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
	 * @var SS_Datetime
	 */
	protected $_lastUpdatedCache = '';

	/**
	 *
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
		return Controller::join_links($this->project->Link(), 'branch?name=' . urlencode($this->Name()));
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

		if($this->_lastUpdatedCache) {
			return $this->_lastUpdatedCache;
		}
		try {
			$created = $this->branch->getCommit()->getCommitterDate();
		} catch(Exception $e) {
			//occasionally parsing will fail this is a fallback to make it still work
			return new SS_Datetime();
		}
		// gitonomy sets the time to UTC, so now we set the timezone to
		// whatever PHP is set to (date.timezone). This will change in the future if each
		// deploynaut user has their own timezone

		$created->setTimezone(new DateTimeZone(date_default_timezone_get()));

		$date = new SS_Datetime();
		$date->setValue($created->format('Y-m-d H:i:s'));
		$this->_lastUpdatedCache = $date;
		return $date;
	}

	/**
	 *
	 * @return string
	 */
	public function IsOpenByDefault() {
		if($this->Name() == 'master') {
			return " open";
		} else {
			return "";
		}
	}

}
