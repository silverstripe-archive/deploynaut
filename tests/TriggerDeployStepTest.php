<?php

class TriggerDeployStepTest extends PipelineTest {

	protected static $fixture_file = 'PipelineTest.yml';

	/**
	 * Makse the dummy deployment step
	 *
	 * @return TriggerDeployStep
	 */
	public function getDummyConfirmationStep() {
		// Load config
		$data = $this->getPipelineConfig();

		// Load data into step and pipeline
		$triggerDeployStep = $this->objFromFixture('TriggerDeployStep', 'testdeploy');
		$pipeline = $triggerDeployStep->Pipeline();
		$pipeline->Config = serialize($data);
		$pipeline->write();
		$triggerDeployStep->Config = serialize($pipeline->getConfigSetting('Steps', 'RequestDeploymentStep'));
		$triggerDeployStep->write();

		return $triggerDeployStep;
	}

	/**
	 * Test that timeout expiry works
	 */
	public function testTimeout() {
		$step = $this->getDummyConfirmationStep();
		$step->start();

		// Assert not error at startup
		$this->assertEquals('Started', $step->Status);

		// Go to two weeks into the future
		SS_Datetime::set_mock_now(date('Y-m-d H:i:s', strtotime('+2 weeks')));

		// Retry step
		$step->start();
		$this->assertEquals('Failed', $step->Status);
		$this->assertTrue($step->isTimedOut());

		// check a log entry exists
		$this->assertHasLog('Deployment step is older then 86400 seconds and has timed out');
	}

	public function testDeploy() {
		SS_Datetime::set_mock_now(date('Y-m-d H:i:s'));
		$step = $this->getDummyConfirmationStep();

		$step->start();
		$step->deploy();

		// Assert not error at startup
		$this->assertEquals('Finished', $step->Status);

		// Assert that 'now' is used for the deployment date
		$this->assertEquals(SS_Datetime::now()->Format('Y-m-d H:i:s'), $step->Deployed);

		$this->assertHasLog('RequestDeploymentStep is being deployed');
	}

	public function testCanTrigger() {
		$step = $this->getDummyConfirmationStep();

		$step->start();

		// can the author trigger the deploy
		$member = Member::get_by_id('Member', $step->Pipeline()->AuthorID);
		$member->logIn();

		$this->assertTrue($step->canTriggerDeploy());

		// can another member with deploy permissions trigger the deploy
		$member = Member::get()
			->filter('Email', 'test3@example.com')
			->first();
		$member->logIn();
		$this->assertTrue($step->canTriggerDeploy());

		$this->logInWithPermission('APPLY_ROLES');
		$this->assertFalse($step->canTriggerDeploy());

		$this->logInWithPermission('ADMIN');
		$this->assertTrue($step->canTriggerDeploy());

		// confirm other members without admin permissions can not trigger the deploy
		$member = Member::get()
			->filter('Email', 'test2@example.com')
			->first();
		$member->logIn();
		$this->assertFalse($step->canTriggerDeploy());

	}

	public function testStartDeployment() {
		$step = $this->getDummyConfirmationStep();

		$step->start();

		$this->logInWithPermission('APPLY_ROLES');
		$this->assertTrue($step->startDeployment());
	}

	public function testRunningConfiguration() {
		$step = $this->getDummyConfirmationStep();

		$step->start();
		$this->logInWithPermission('ADMIN');
		$this->assertEquals('Please press the "Deploy" button to continue deployment',
			$step->getRunningDescription());
	}

	public function testStartFail() {
		$step = $this->getDummyConfirmationStep();
		// set status so it fails
		$step->Status = 'Failed';

		$this->assertFalse($step->start());
	}
}
