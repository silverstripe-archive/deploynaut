<?php

/**
 * DNFinishedCommits
 *
 *  Class to represent started commits
 *
 */
class DNStartedCommits extends DNFilteredCommits {

	private static $description = 'Commits that have been started';

	public function __construct() {
		parent::__construct();
		$this->setFilter('Started');
	}

}
