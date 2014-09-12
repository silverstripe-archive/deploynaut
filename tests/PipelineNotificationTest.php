<?php

/**
 * Tests the pipeline notification process
 */
class PipelineNotificationTest extends PipelineTest {

	protected static $fixture_file = 'PipelineTest.yml';

	/**
	 * Makes the dummy pipeline
	 *
	 * @return Pipeline
	 */
	public function getDummyPipeline() {
		// Load data into step and pipeline
		$data = $this->getPipelineConfig();
		$pipeline = $this->objFromFixture('Pipeline', 'testpipe');
		$pipeline->Config = serialize($data);
		$pipeline->write();

		return $pipeline;
	}

	/**
	 * Test success notification
	 */
	public function testSendSuccess() {
		$pipeline = $this->getDummyPipeline();

		// Assert dependencies are injected
		$this->assertTrue($pipeline->getMessagingService() instanceof ConfirmationMessagingService);
		$pipeline->start();
		$this->logInWithPermission('ADMIN');
		$pipeline->markComplete();

		// Assert not error at startup
		$this->assertEquals('Complete', $pipeline->Status);
		$this->assertHasLog('Pipeline completed successfully.');
		$this->assertSentMessage('Deployment for testproject/uat has successfully completed', 'success@example.com');
		$this->assertSentMessage('Deployment for testproject/uat has successfully completed', 'test@example.com');
	}

	/**
	 * Test abort
	 */
	public function testSendAbort() {
		$pipeline = $this->getDummyPipeline();

		// Assert dependencies are injected
		$this->assertTrue($pipeline->getMessagingService() instanceof ConfirmationMessagingService);
		$pipeline->start();
		$this->logInWithPermission('ADMIN');
		$pipeline->markAborted();

		// Assert not error at startup
		$this->assertEquals('Aborted', $pipeline->Status);
		$this->assertHasLog('Pipeline processing aborted. ADMIN User (ADMIN@example.org) aborted the pipeline');
		$this->assertSentMessage('Deployment for testproject/uat has been aborted', 'abort@example.com');
		$this->assertSentMessage('Deployment for testproject/uat has been aborted', 'test@example.com');
	}

	/**
	 * Test abort
	 */
	public function testSendFailure() {
		$pipeline = $this->getDummyPipeline();

		// Assert dependencies are injected
		$this->assertTrue($pipeline->getMessagingService() instanceof ConfirmationMessagingService);
		$pipeline->start();
		$this->logInWithPermission('ADMIN');
		$pipeline->markFailed();

		// Assert not error at startup
		$this->assertEquals('Failed', $pipeline->Status);
		$this->assertHasLog('Pipeline failed, not running rollback (not configured or not applicable yet).');
		$this->assertSentMessage('Deployment for testproject/uat has failed', 'abort@example.com');
		$this->assertSentMessage('Deployment for testproject/uat has failed', 'errors@example.com');
		$this->assertSentMessage('Deployment for testproject/uat has failed', 'test@example.com');
	}

}
