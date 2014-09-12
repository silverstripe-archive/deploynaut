<?php

/**
 * DNQueuedCommits
 *
 *  Class to represent queued commits
 *
 */
class DNQueuedCommits extends DNFilteredCommits {

	private $description = 'Commits that are currently queued';

	public function __construct() {
		parent::__construct();
		$this->setFilter('Queued');
	}

}
