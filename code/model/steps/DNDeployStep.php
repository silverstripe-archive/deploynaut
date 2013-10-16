<?php

/**
 * Defines a step that is triggered by deploying to a specific environment
 */
class DNDeployStep extends DNReleaseStep {
	public static $has_one = array(
		"Environment" => "DNEnvironment",
	);

	public function getCMSFields() {
		$fields = parent::getCMSFields();

		// Limit the environments listed to the ones in this project
		$fields->dataFieldByName('EnvironmentID')->setSource($this->Project()->Environments()->map());

		return $fields;
	}

	public function getReleaseStatus(DNCommit $commit, $sha) {
		return $commit->EverDeployedTo($this->Environment()->Name) ? 'success' : null;
	}

	public function getReleaseLink(DNCommit $commit, $sha) {
		return $this->Environment()->Link();
	}
}
