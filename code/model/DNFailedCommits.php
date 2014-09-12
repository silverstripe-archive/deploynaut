<?php

/**
 * DNFailedCommits
 *
 *  Class to represent failed commits
 *
 */
class DNFailedCommits extends DNFilteredCommits {

	private $description = 'Commits that have failed in the past';

	public function __construct() {
		parent::__construct();
		$this->setFilter('Failed');
	}

}
