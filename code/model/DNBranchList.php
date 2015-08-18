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

		try {
			$repository = new Gitonomy\Git\Repository($this->project->LocalCVSPath);
		} catch(Exception $e) {
			return $branches;
		}

		foreach($repository->getReferences()->getBranches() as $branch) {
			$obj = DNBranch::create($branch, $this->project, $this->data);
			if($branch->getName() == 'master') {
				$firstBranch = array($branch->getName() => $obj);
			} else {
				$branches[$branch->getName()] = $obj;
			}
		}
		if($firstBranch) {
			$branches = $firstBranch + $branches;
		}

		return $branches;
	}

	/**
	 * Find a branch in this set by branch name.
	 */
	public function byName($name) {
		if($this->loaded == false) {
			$this->getIterator();
		}

		if(isset($this->items[$name])) {
			return $this->items[$name];
		}
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
			if(is_array($item)) {
				$this->items[$i] = new ArrayData($item);
			}
		}
		return new ArrayIterator($this->items);
	}
}
