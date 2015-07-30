<?php

class DNReferenceList extends ArrayList {

	protected static $refs_dir = '';

	protected $loaded = false;

	protected $reference = null;

	protected $blockBranch;

	protected $builds = array();

	protected $limit = 10;

	protected $getTags = false;

	public static function set_refs_dir($refsDir) {
		self::$refs_dir = $refsDir;
	}

	public static function get_refs_dir() {
		return self::$refs_dir;
	}

	/**
	 * @param DNProject $project
	 * @param DNData $data
	 * @param Gitonomy\Git\Reference $reference
	 * @param string $blockBranch
	 * @param bool $getTags
	 */
	public function __construct(
		DNProject $project,
		DNData $data,
		Gitonomy\Git\Reference $reference = null,
		$blockBranch = null,
		$getTags = false
	) {
		$this->project = $project;
		$this->data = $data;
		$this->reference = $reference;
		$this->blockBranch = $blockBranch;
		$this->getTags = $getTags;
		parent::__construct(array());
	}

	/**
	 * @param int $limit
	 */
	public function setLimit($limit) {
		$this->limit = $limit;
		return $this;
	}

	/**
	 * @param int $limit - defaults to the ten lates
	 * @return array()
	 */
	protected function getReferences() {
		try {
			$repository = new Gitonomy\Git\Repository($this->project->LocalCVSPath);
		} catch (Exception $e) {
			return array();
		}

		if($this->getTags) {
			if($this->reference) throw new LogicException("Can't have \$reference and \$getTags both set");
			$log = $repository->getReferences()->getTags();

		} else if($this->reference) {
			$log = $this->reference->getLog();
		} else {
			$log = $repository->getLog();
		}

		if($this->limit) {
			if(is_array($log)) {
				$limitedLog = array_slice($log, 0, $this->limit);
			} else {
				$limitedLog = $log->setLimit($this->limit);
			}
		} else {
			$limitedLog = $log;
		}

		// cache them for look up in byName
		$builds = array();
		foreach($limitedLog as $reference) {
			if($this->blockBranch) {
				$branchesIncluding = GitonomyCache::getIncludingBranches($reference);
				foreach($branchesIncluding as $candidate) {
					if($candidate->getName() == $this->blockBranch) {
						// Break out of the function
						return $builds;
					}
				}
			}

			if($this->getTags) {
				$builds[$reference->getCommitHash()] = DNTag::create($reference, $this->project, $this->data);

			} else {
				$name = $this->reference ? $this->reference->getName() : '';
				$builds[$reference->getHash()] = DNCommit::create($reference, $this->project, $this->data, $name);
			}
		}
		return $builds;
	}

	/**
	 * Find a build in this set by hash.
	 */
	public function byName($hash) {
		if($this->loaded == false) {
			$this->items = $this->getReferences();
			$this->loaded = true;
		}
		// The item might not be in the list because of the limit, try to find
		// in an older version and add it to the list.
		if(!isset($this->items[$hash])) {
			$repository = new Gitonomy\Git\Repository($this->project->LocalCVSPath);
			$commit = new Gitonomy\Git\Commit($repository, $hash);
			$this->items[$hash] = DNCommit::create($commit, $this->project, $this->data);
		};

		return $this->items[$hash];
	}

	public function Count() {
		$this->getIterator();
		return parent::Count();
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
