<?php

/**
 * @package deploynaut
 * Class DNPipelineCommits
 *
 * This tests the pipeline commit functionality however it does not make use of
 * any Git repositories but mimics the data with a test class
 */
class DNPipelineCommitsTest extends DeploynautTest {

	// Fixture file continaing test commit data
	protected static $fixture_file = 'DNPipelineCommitsTest.yml';

	protected function getMockEnvironment() {
		$source = $this->objFromFixture('DNEnvironment', 'Env1');
		$env = new DNPipelineCommits_Test();
		$env->ID = $source->ID;
		return $env;
	}

	public function testStartedGetCommits() {
		$filter = DNStartedCommits::create();
		$filter->env = $this->getMockEnvironment();
		$commits = $filter->getCommits();
		$this->assertEquals(array('5f0c018f97225b2851f84gf87f64865z42h0527t'), $commits->column('SHA'));
	}

	public function testQueuedGetCommits() {
		$filter = DNQueuedCommits::create();
		$filter->env = $this->getMockEnvironment();
		$commits = $filter->getCommits();
		$this->assertEquals(array('7f0c016f97275b2451f24cf87f14865e42a0927c'), $commits->column('SHA'));
	}

	public function testFailedGetCommits() {
		$filter = DNFailedCommits::create();
		$filter->env = $this->getMockEnvironment();
		$commits = $filter->getCommits();
		$this->assertEquals(array('9f0a012e97715b1871n41gk30f34268u12a0029q'), $commits->column('SHA'));
	}

	public function testFinishedGetCommits() {
		$filter = DNFinishedCommits::create();
		$filter->env = $this->getMockEnvironment();
		$commits = $filter->getCommits();
		$this->assertEquals(array('8f0q012f97725b1851n84gk87f34868z42l0524p'), $commits->column('SHA'));
	}
}


class DNPipelineCommits_Test implements TestOnly {

	public $ID = null;

	public function DeployHistory() {
		return DNDeployment::get()
			->filter('EnvironmentID', $this->ID)
			->sort('LastEdited DESC');
	}
}
