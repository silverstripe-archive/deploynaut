<?php


class DNCommit extends ViewableData {

	/**
	 *
	 * @var Gitonomy\Git\Commit
	 */
	protected $commit = null;


	protected $name = null;

	protected $references = null;
	
	/**
	 *
	 * @param Gitonomy\Git\Commit $commit
	 * @param DNProject $project
	 * @param DNData $data
	 */
	public function __construct(Gitonomy\Git\Commit $commit, DNProject $project, DNData $data) {
		$this->commit = $commit;
		$this->buildname = $commit->getHash();
		$this->project = $project;
		$this->data = $data;
	}

	/**
	 *
	 * @return type
	 */
	public function Name() {
		if($this->name == null) {
			$this->name = $this->commit->getFixedShortHash(8);
		}
		
		return $this->name;
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
		
		foreach($this->commit->resolveReferences() as $reference) {
			$data = array('Name'=>$reference->getName());
			if($reference instanceof \Gitonomy\Git\Reference\Branch) {
				$data['Type'] = 'Branch';
			} elseif($reference instanceof \Gitonomy\Git\Reference\Tag) {
				$data['Type'] = 'Tag';
			} elseif($reference instanceof \Gitonomy\Git\Reference\Stash) {
				$data['Type'] = 'Stash';
			}
			$this->references->push(new ArrayData($data));
		}
		return $this->references;
	}

	/**
	 *
	 * @return string
	 */
	public function FullName() {
		return $this->commit->getHash();
	}

	/**
	 *
	 * @return string
	 */
	public function Filename() {
		return $this->commit->getHash();
	}

	/**
	 *
	 * @return ArrayList
	 */
	public function CurrentlyDeployedTo() {
		$output = new ArrayList();
		foreach($this->project->DNEnvironmentList() as $environment) {
			if($environment->CurrentBuild() == $this->buildname) $output->push($environment);
		}
		return $output;
	}

	/**
	 *
	 * @return SS_Datetime 
	 */
	public function Created() {
		$created = $this->commit->getCommitterDate();

		$d = new SS_Datetime();
		$d->setValue($created->format('Y-m-d H:i:s'));
		return $d;
	}

}