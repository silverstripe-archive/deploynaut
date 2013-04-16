<?php

class DNReferenceList extends ArrayList {

	protected static $refs_dir = '';

	protected $loaded = false;

	protected $reference = null;

	protected $blockBranch;
	
	protected $builds = array();

	public static function set_refs_dir($refsDir) {
		self::$refs_dir = $refsDir;
	}

	public static function get_refs_dir() {
		return self::$refs_dir;
	}

	/**
	 *
	 * @param string $buildFolder - name of buildfolder inside of $builds_dir
	 * @param DNProject $project
	 * @param DNData $data
	 */
	public function __construct(DNProject $project, DNData $data, Gitonomy\Git\Reference $reference = null, $blockBranch = null) {
		$this->project = $project;
		$this->data = $data;
		$this->reference = $reference;
		$this->blockBranch = $blockBranch;
		parent::__construct(array());
	}

	/**
	 * @return array()
	 */
	protected function getReferences() {
		$repository = new Gitonomy\Git\Repository($this->project->LocalCVSPath);
		$repository->run('fetch', array('origin', '+refs/heads/*:refs/heads/*', '--tags'));

		if($this->reference) {
			$log = $this->reference->getLog();
		} else {
			$log = $repository->getLog();
		}

		// cache them for look up in byName
		$builds = array();
		foreach($log->setLimit(10) as $reference) {
			if($this->blockBranch) {
				$branchesIncluding = GitonomyCache::getIncludingBranches($reference);
				foreach($branchesIncluding as $candidate) {
					if($candidate->getName() == $this->blockBranch) {
						// Break out of the function
						return $builds;
					}
				}
			}

			$name = $this->reference ? $this->reference->getName() : '';
			$builds[$reference->getHash()] = new DNCommit($reference, $this->project, $this->data, $name);
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
