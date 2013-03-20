<?php

class DNReferenceList extends ArrayList {

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
	 * @param string $buildFolder - name of buildfolder inside of $builds_dir
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
		$repository = new Gitonomy\Git\Repository($this->project->LocalCVSPath);
		$repository->run('fetch', array('origin', '--tags'));
		
		// cache them for look up in byName
		$builds = array();
		foreach($repository->getLog()->setLimit(10) as $reference) {
			$builds[$reference->getHash()] = new DNCommit($reference, $this->project, $this->data);
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