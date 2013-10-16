<?php

class DNBranchList extends ArrayList {

	protected static $refs_dir = '';

	protected $loaded = false;

	protected $builds = array();

	public static function set_refs_dir($refsDir) {
		self::$refs_dir = $refsDir;
	}

	public static function get_refs_dir() {
		return self::$refs_dir;
	}

	/**
	 *
	 * @param DNProject $project
	 * @param DNData $data
	 */
	public function __construct(DNProject $project, DNData $data) {
		$this->project = $project;
		$this->data = $data;
		parent::__construct(array());
	}

	/**
	 * @return array()
	 */
	protected function getReferences() {
		$branches = array();
		// Placeholder to put master branch first
		$firstBranch = null;

		// return an empty array if the version control isn't checked out yet
		if(!file_exists($this->project->LocalCVSPath)) return array();

		$repository = new Gitonomy\Git\Repository($this->project->LocalCVSPath);
		foreach($repository->getReferences()->getBranches() as $branch) {
			$obj = new DNBranch($branch, $this->project, $this->data);
			if($branch->getName() == 'master') $firstBranch = $obj;
			else $branches[] = $obj;
		}
		if($firstBranch) array_unshift($branches, $firstBranch);

		return $branches;
	}

	/**
	 * Find a build in this set by hash.
	 */
	public function byName($hash) {
		if($this->loaded == false) {
			$this->items = $this->getReferences();
			$this->loaded = true;
		}
		return $this->items[$hash];
	}

	/**
	 * Returns an Iterator for this ArrayList.
	 * This function allows you to use ArrayList in foreach loops
	 *
	 * @return ArrayIterator
	 */
	public function getIterator() {
		if($this->loaded == false) {
			$this->items = $this->getReferences();
			$this->loaded = true;
		}
		foreach($this->items as $i => $item) {
			if(is_array($item)) $this->items[$i] = new ArrayData($item);
		}
		return new ArrayIterator($this->items);
	}
}
