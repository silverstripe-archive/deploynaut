<?php

/**
 * Defines a step that is triggered by deploying to a specific environment
 */
class DNDeployStep extends DNReleaseStep {
	static $has_one = array(
		"Environment" => "DNEnvironment",
	);

	function getCMSFields() {
		$fields = parent::getCMSFields();

		// Limit the environments listed to the ones in this project
		$fields->dataFieldByName('EnvironmentID')->setSource($this->Project()->Environments()->map());

		return $fields;
	}

	function getReleaseStatus(DNCommit $commit, $sha) {
		return $commit->EverDeployedTo($this->Environment()->Name) ? 'success' : null;
	}

	function getReleaseLink(DNCommit $commit, $sha) {
		return $this->Environment()->Link();
	}
}