<?php

class SmokeTestPipelineStepTest extends PipelineTest {

	protected static $fixture_file = 'PipelineTest.yml';

	/**
	 * Make the dummy deployment step
	 *
	 * @return SmokeTestPipelineStep
	 */
	public function getDummySmokeTestStep($name) {
		// Load data inte step and pipeline
		$data = $this->getPipelineConfig();
		$smokeStep = $this->objFromFixture('SmokeTestPipelineStep', 'testsmoketest');
		$pipeline = $smokeStep->Pipeline();
		$pipeline->Config = serialize($data);
		$pipeline->write();
		$smokeStep->Config = serialize($pipeline->getConfigSetting('Steps', $name));
		$smokeStep->write();
		return $smokeStep;
	}

	/**
	 * Test successful smoke test
	 */
	public function testSmokeTestPass() {
		$step = $this->getDummySmokeTestStep('SmokeTest');
		$this->assertTrue($step->start());
		$this->assertHasLog('Starting smoke test "Videos" to URL http://www.youtube.com/');
		$this->assertHasLog('Smoke test "Videos" to URL http://www.youtube.com/ successful');
		$this->assertHasLog('Starting smoke test "Home" to URL https://github.com/');
		$this->assertHasLog('Smoke test "Home" to URL https://github.com/ successful');
		$this->assertEquals('Finished', $step->Status);
	}

	/**
	 * Test failed smoke test
	 */
	public function testSmokeTestFail() {
		// the testsmokefaile yml config contains a invalid smoketest url
		// which is how it fails
		$step = $this->getDummySmokeTestStep('FailTest');
		$this->assertFalse($step->start());
		$this->assertHasLog('Starting smoke test "BrokenPage" to URL http://bob.bob.bob.bob/');
		$this->assertHasLog('Smoke test "BrokenPage" to URL http://bob.bob.bob.bob/ failed');
		$this->assertHasLog('Starting smoke test "Home" to URL https://github.com/');
		$this->assertHasLog('Smoke test "Home" to URL https://github.com/ successful');
		$this->assertEquals('Failed', $step->Status);
	}
}
