<?php


class DNCommit extends ViewableData {

	/**
	 *
	 * @var Gitonomy\Git\Commit
	 */
	protected $commit;

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
		$references = $this->commit->resolveReferences();
		if($references) {
			$names = array();
			foreach($references as $ref) {
				$names[] = $ref->getFullName();
			}
			$refs = implode(', ', $names);
			#return $refs.' - '.$this->commit->getSubjectMessage();
		}
		return $this->commit->getHash();
		return $this->commit->getSubjectMessage();
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

}