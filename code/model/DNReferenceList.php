<?php

use Gitonomy\Git\Reference;

class DNReferenceList extends ArrayList {

	/**
	 * @var string
	 */
	protected static $refs_dir = '';

	/**
	 * @var bool
	 */
	protected $loaded = false;

	/**
	 * @var Reference|null
	 */
	protected $reference = null;

	/**
	 * @var null|string
	 */
	protected $blockBranch;

	/**
	 * @var array
	 */
	protected $builds = array();

	/**
	 * @var int
	 */
	protected $limit = 10;

	/**
	 * @var bool
	 */
	protected $getTags = false;

	/**
	 * @var DNProject
	 */
	protected $project;

	/**
	 * @var DNData
	 */
	protected $data;

	/**
	 * @param $refsDir
	 */
	public static function set_refs_dir($refsDir) {
		self::$refs_dir = $refsDir;
	}

	/**
	 * @return string
	 */
	public static function get_refs_dir() {
		return self::$refs_dir;
	}

	/**
	 * @param DNProject $project
	 * @param DNData $data
	 * @param Reference|null $reference
	 * @param string|null $blockBranch
	 * @param bool $getTags
	 */
	public function __construct(
		DNProject $project,
		DNData $data,
		Reference $reference = null,
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
	 * @return DNReferenceList
	 */
	public function setLimit($limit) {
		$this->limit = $limit;
		return $this;
	}

	/**
	 * @return array
	 */
	protected function getReferences() {
		try {
			$repository = new Gitonomy\Git\Repository($this->project->getLocalCVSPath());
		} catch(Exception $e) {
			return array();
		}

		if($this->getTags) {
			if($this->reference) {
				throw new LogicException("Can't have \$reference and \$getTags both set");
			}
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
			if(!empty($this->blockBranch)) {
				$branchesIncluding = GitonomyCache::getIncludingBranches($reference);
				foreach($branchesIncluding as $candidate) {
					if($candidate->getName() == $this->blockBranch) {
						// Break out of the function
						return $builds;
					}
				}
			}

			if($this->getTags) {
				$builds[] = DNTag::create($reference, $this->project, $this->data);
			} else {
				$name = $this->reference ? $this->reference->getName() : '';
				$builds[] = DNCommit::create($reference, $this->project, $this->data, $name);
			}
		}

		return $builds;
	}

	/**
	 * Find a build in this set by hash.
	 *
	 * @param string $hash
	 * @return DNCommit
	 */
	public function byName($hash) {
		if($this->loaded === false) {
			$this->items = $this->getReferences();
			$this->loaded = true;
		}

		// The item might not be in the list because of the limit, try to find
		// in an older version and add it to the list.
		$found = null;
		foreach($this->items as $item) {
			if($item->SHA() == $hash) {
				$found = $item;
				break;
			}
		}

		if($found === null) {
			$repository = new Gitonomy\Git\Repository($this->project->getLocalCVSPath());
			$commit = new Gitonomy\Git\Commit($repository, $hash);
			$found = DNCommit::create($commit, $this->project, $this->data);
		}

		return $found;
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
		if($this->loaded === false) {
			$this->items = $this->getReferences();
			$this->loaded = true;
		}
		foreach($this->items as $item) {
			if(is_array($item)) {
				$this->items[] = new ArrayData($item);
			}
		}
		return new ArrayIterator($this->items);
	}
}
