<?php

class DNProjectRepositoryInterfaceTest extends DeploynautTest {

	public function testURLParsing() {
		$shouldMatchURLs = array(
			'https://github.com/silverstripe/deploynaut.git',
			'github.com:silverstripe/deploynaut.git',
			'git@github.com:silverstripe/deploynaut.git',
			'ssh://git@github.com:22/silverstripe/deploynaut.git'
		);

		$project = new DNProject();

		foreach($shouldMatchURLs as $url) {
			$project->CVSPath = $url;
			$repositoryInterface = $project->getRepositoryInterface();

			$this->assertEquals(
				'https://github.com/silverstripe/deploynaut',
				$repositoryInterface->URL,
				"Failed to extract repository from " . $url
			);
		}

		$shouldntMatchURLs = array(
			'https://othersite.com/github.com/ranking'
		);

		foreach($shouldntMatchURLs as $url) {
			$project->CVSPath = $url;
			$repositoryInterface = $project->getRepositoryInterface();

			$this->assertNull($repositoryInterface);
		}

	}

}