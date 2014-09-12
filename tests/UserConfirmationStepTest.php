<?php

class UserConfirmationStepTest extends PipelineTest {

	protected static $fixture_file = 'PipelineTest.yml';

	/**
	 * Makes the dummy confirmation step
	 *
	 * @return UserConfirmationStep
	 */
	public function getDummyConfirmationStep() {
		// Load data into step and pipeline
		$data = $this->getPipelineConfig();
		$confirmStep = $this->objFromFixture('UserConfirmationStep', 'testconfirm');
		$pipeline = $confirmStep->Pipeline();
		$pipeline->Config = serialize($data);
		$pipeline->write();
		$confirmStep->Config = serialize($pipeline->getConfigSetting('Steps', 'RequestConfirmationStep'));
		$confirmStep->write();

		return $confirmStep;
	}

	/**
	 * Test that timeout expiry works
	 */
	public function testTimeout() {
		$step = $this->getDummyConfirmationStep();

		// Assert dependencies are injected
		$this->assertTrue($step->getMessagingService() instanceof ConfirmationMessagingService);
		$step->start();

		// Assert not error at startup
		$this->assertEquals('Started', $step->Status);
		$this->assertHasLog('Starting TestConfirmStep...');

		// Go to two weeks into the future
		SS_Datetime::set_mock_now(date('Y-m-d H:i:s', strtotime('+2 weeks')));

		// Retry step
		$this->clearLog();
		$step->start();
		$this->assertEquals('Failed', $step->Status);
		$this->assertTrue($step->isTimedOut());
		$this->assertSentMessage(
			'Deployment approval for testproject/uat has timed out due to no response',
			'test@example.com'
		);
		$this->assertSentMessage(
			'Deployment approval for testproject/uat has timed out due to no response',
			'admin@example.com'
		);
		$this->assertHasLog(
			"TestConfirmStep took longer than 604800 seconds (7 days) to be approved and has timed out"
		);
	}

	public function testSendConfirm() {
		$step = $this->getDummyConfirmationStep();

		// Assert dependencies are injected
		$this->assertTrue($step->getMessagingService() instanceof ConfirmationMessagingService);
		$step->start();

		// Assert not error at startup
		$this->assertEquals('Started', $step->Status);
		$this->assertEquals('None', $step->Approval);
		$this->assertHasLog('Starting TestConfirmStep...');
		$this->assertFalse($step->isTimedOut());
		$link = Director::absoluteURL('naut/project/testproject/environment/uat');
		$this->assertSentMessage(
			"You requested approval for deployment of testproject/uat. Cancel? {$link}",
			'test@example.com'
		);
		$this->assertSentMessage(
			"Deployment for testproject/uat requested by Marley, Bob. Approve? {$link}",
			'admin@example.com'
		);
	}

	/**
	 * Test delayed notification
	 */
	public function testSendDelay() {
		$step = $this->getDummyConfirmationStep();

		// Assert dependencies are injected
		$this->assertTrue($step->getMessagingService() instanceof ConfirmationMessagingService);
		$step->start();

		// Assert not error at startup
		$this->assertEquals('Started', $step->Status);
		$this->assertHasLog('Starting TestConfirmStep...');

		// Check only recipient and first admin has been notified
		$this->assertFalse($step->isTimedOut());
		$link = Director::absoluteURL('naut/project/testproject/environment/uat');
		$this->assertSentMessage(
			"You requested approval for deployment of testproject/uat. Cancel? {$link}",
			'test@example.com'
		);
		$this->assertSentMessage(
			"Deployment for testproject/uat requested by Marley, Bob. Approve? {$link}",
			'admin@example.com'
		);
		$this->assertEquals(2, count(PipelineTest_RecordingMessageSender::get_messages()));

		// Advance 1 hour and ensure no other notifications have been sent
		SS_Datetime::set_mock_now(date('Y-m-d H:i:s', strtotime('+1 hour')));
		$this->clearLog();
		$step->start();
		$this->assertFalse($step->isTimedOut());
		$this->assertEmpty(PipelineTest_RecordingMessageSender::get_messages());

		// Advance 3 hours (2 more) and ensure the next notification is sent out
		SS_Datetime::set_mock_now(date('Y-m-d H:i:s', strtotime('+3 hour')));
		$this->clearLog();
		$step->start();
		$this->assertFalse($step->isTimedOut());
		$this->assertSentMessage(
			"Deployment for testproject/uat requested by Marley, Bob. Approve? {$link}",
			'failover@example.com'
		);
		$this->assertSentMessage(
			"Deployment for testproject/uat requested by Marley, Bob. Approve? {$link}",
			'second@example.com'
		);
		$this->assertEquals(2, count(PipelineTest_RecordingMessageSender::get_messages()));

		// Go to 5 hours (another 2) and ensure the final notification is sent
		SS_Datetime::set_mock_now(date('Y-m-d H:i:s', strtotime('+5 hour')));
		$this->clearLog();
		$step->start();
		$this->assertFalse($step->isTimedOut());
		$this->assertSentMessage(
			"Deployment for testproject/uat requested by Marley, Bob. Approve? {$link}",
			'error@example.com'
		);
		$this->assertEquals(1, count(PipelineTest_RecordingMessageSender::get_messages()));

		// Go to 24 hours and ensure no notifications are sent
		SS_Datetime::set_mock_now(date('Y-m-d H:i:s', strtotime('+24 hour')));
		$this->clearLog();
		$step->start();
		$this->assertFalse($step->isTimedOut());
		$this->assertEmpty(PipelineTest_RecordingMessageSender::get_messages());
	}

	public function testRejection() {
		$step = $this->getDummyConfirmationStep();

		// Assert dependencies are injected
		$this->assertTrue($step->getMessagingService() instanceof ConfirmationMessagingService);
		$step->start();
		$this->logInWithPermission('ADMIN');
		$step->reject();

		// Assert not error at startup
		$this->assertEquals('Failed', $step->Status);
		$this->assertEquals('Rejected', $step->Approval);
		$this->assertHasLog('TestConfirmStep has been rejected');
		$this->assertSentMessage('Deployment for testproject/uat has been rejected', 'test@example.com');
		$this->assertSentMessage('Deployment for testproject/uat has been rejected', 'admin@example.com');
	}

	public function testApproval() {
		$step = $this->getDummyConfirmationStep();

		// Assert dependencies are injected
		$this->assertTrue($step->getMessagingService() instanceof ConfirmationMessagingService);
		$step->start();
		$this->logInWithPermission('ADMIN');
		$step->approve();

		// Assert not error at startup
		$this->assertEquals('Finished', $step->Status);
		$this->assertEquals('Approved', $step->Approval);
		$this->assertHasLog('TestConfirmStep has been approved');
		$this->assertSentMessage('Deployment for testproject/uat has been approved', 'test@example.com');
		$this->assertSentMessage('Deployment for testproject/uat has been approved', 'admin@example.com');
	}
}
