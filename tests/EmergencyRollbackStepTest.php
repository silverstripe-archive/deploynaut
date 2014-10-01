<?php

class EmergencyRollbackStepTest extends PipelineTest {

	protected static $fixture_file = 'PipelineTest.yml';

	/**
	 * Makse the dummy deployment step
	 *
	 * @return EmergencyRollbackStep
	 */
	public function getDummyConfirmationStep() {
		// Load config
		$data = $this->getPipelineConfig();

		// Load data into step and pipeline
		$emergencyRollback = $this->objFromFixture('EmergencyRollbackStep', 'testdeploy');
		$pipeline = $emergencyRollback->Pipeline();
		$pipeline->Config = serialize($data);
		$pipeline->write();
		$emergencyRollback->Config = serialize($pipeline->getConfigSetting('Steps', 'RollbackWindowStep'));
		$emergencyRollback->write();

		return $emergencyRollback;
	}

	/**
	 * Test that timeout expiry works
	 */
	public function testTimeout() {
		$step = $this->getDummyConfirmationStep();
		$step->start();

		// Assert not error at startup
		$this->assertEquals('Started', $step->Status);

		// Go to two hours in the future
		SS_Datetime::set_mock_now(date('Y-m-d H:i:s', strtotime('+2 hours')));

		// Retry step
		$step->start();
		$this->assertEquals('Finished', $step->Status);
		$this->assertTrue($step->isTimedOut());

		// check a log entry exists
		$this->assertHasLog('RollbackWindowStep is older than 3600 seconds and has timed out');
	}

	public function testRollback() {
		SS_Datetime::set_mock_now(date('Y-m-d H:i:s'));
		$step = $this->getDummyConfirmationStep();

		$step->start();
		$step->rollback();

		// Assert not error at startup
		$this->assertEquals('Started', $step->Status);

		// Assert that 'now' is used for the deployment date
		$this->assertEquals(SS_Datetime::now()->Format('Y-m-d H:i:s'), $step->RolledBack);

		$this->assertHasLog('RollbackWindowStep is being rolled back');
	}

	public function testDismiss() {
		SS_Datetime::set_mock_now(date('Y-m-d H:i:s'));
		$step = $this->getDummyConfirmationStep();

		$step->start();
		$step->dismiss();

		// Assert not error at startup
		$this->assertEquals('Finished', $step->Status);
		$this->assertHasLog('Dismissing rollback window.');
	}

	public function testCanRollback() {
		$step = $this->getDummyConfirmationStep();

		$step->start();

		// can the author trigger a rollback
		$member = Member::get_by_id('Member', $step->Pipeline()->AuthorID);
		$member->logIn();

		$this->assertTrue($step->canTriggerRollback());

		// can another member with deploy permissions trigger a rollback
		$member = Member::get()
			->filter('Email', 'test3@example.com')
			->first();
		$member->logIn();
		$this->assertTrue($step->canTriggerRollback());

		$this->logInWithPermission('APPLY_ROLES');
		$this->assertFalse($step->canTriggerRollback());

		$this->logInWithPermission('ADMIN');
		$this->assertTrue($step->canTriggerRollback());

		// confirm other members without admin permissions can not trigger a rollback
		$member = Member::get()
			->filter('Email', 'test2@example.com')
			->first();
		$member->logIn();
		$this->assertFalse($step->canTriggerRollback());

	}

	public function testBeginRollbackWindow() {
		$step = $this->getDummyConfirmationStep();

		$step->start();

		$this->logInWithPermission('APPLY_ROLES');
		$this->assertTrue($step->beginRollbackWindow());

		// Check that the message is sent
		$this->assertSentMessage('Deployment for testproject/uat has successfully completed', 'test@example.com');
	}

	public function testRunningConfiguration() {
		$step = $this->getDummyConfirmationStep();

		$step->start();
		$this->logInWithPermission('ADMIN');
		$this->assertEquals('Please press the "Rollback" button to rollback deployment',
			$step->getRunningDescription());
	}

	public function testStartFail() {
		$step = $this->getDummyConfirmationStep();
		// set status so it fails
		$step->Status = 'Failed';

		$this->assertFalse($step->start());

		// Check that the message is sent
		$this->assertNotSentMessage('Deployment for testproject/uat has successfully completed', 'test@example.com');
	}
}
