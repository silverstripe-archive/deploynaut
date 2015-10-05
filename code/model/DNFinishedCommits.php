<?php

/**
 * DNFinishedCommits
 *
 *  Class to represent finished commits
 *
 */
class DNFinishedCommits extends DNFilteredCommits {
	/**
	 * @var string
	 */
	private $description = 'Commits successfully deployed in the past';

	public function __construct() {
		parent::__construct();
		$this->setFilter('Finished');
	}
}
