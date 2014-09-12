<?php

/**
 * Test rollback of deployments
 */
class RollbackStepTest extends PipelineTest {

	protected static $fixture_file = 'PipelineTest.yml';

	public function setUp() {
		parent::setUp();
		Injector::inst()->load(array(
			'DNDeployment' => 'DeploymentPipelineStepTest_DNDeployment',
			'DNDataTransfer' => 'DeploymentPipelineStepTest_DNDataTransfer'
		));
	}

	/**
	 * Makes the dummy deployment step
	 *
	 * @return Pipeline
	 */
	public function getDummyPipeline($restoreDB = true) {
		// Get default backups
		$previous = DNDeployment::create();
		$previous->write();
		$current = DNDeployment::create();
		$current->write();
		$snapshot = DNDataTransfer::create();
		$snapshot->write();

		// Setup default pipeline
		$pipeline = $this->objFromFixture('Pipeline', 'testpipesmoketest');
		$pipeline->Config = serialize(array(
			'RollbackStep1' => array(
				'Class' => 'RollbackStep',
				'RestoreDB' => $restoreDB,
				'MaxDuration' => '3600'
			)
		));
		$pipeline->PreviousDeploymentID = $previous->ID;
		$pipeline->CurrentDeploymentID = $current->ID;
		$pipeline->PreviousSnapshotID = $snapshot->ID;
		$pipeline->write();
		return $pipeline;
	}

	public function testSuccessful() {
		$pipeline = $this->getDummyPipeline();

		// Start failure
		$pipeline->markFailed();
		$step = $pipeline->RollbackStep1();

		// Assert not error at startup
		$this->assertEquals('Started', $step->Status);
		$this->assertEquals('Deployment', $step->Doing);
		$this->assertNotLogged('Maintenance page disabled'); // Shouldn't be disabled yet

		// Mark the service as completed and check result
		$deployment = $step->RollbackDeployment();
		$deployment->markFinished();

		// Re-enter step as if called from checkPipelineStatus
		PipelineTest_MockLog::clear();
		$step->start();

		$this->assertEquals('Started', $step->Status);
		$this->assertEquals('Snapshot', $step->Doing);
		$this->assertNotLogged('Maintenance page disabled'); // Shouldn't be disabled yet

		// Mark the snapshot as completed and check result
		$snapshot = $step->RollbackDatabase();
		$snapshot->markFinished();

		// Re-enter step as if called from checkPipelineStatus
		PipelineTest_MockLog::clear();
		$step->start();

		$this->assertEquals('Finished', $step->Status);
		// confirm the maintenace page has been left up for a failed rollback
		$this->assertFalse(PipelineTest_MockLog::has_message('Enabling maintenance page for failed rollback'));
	}

	/**
	 * Test rollback without DB restoration
	 */
	public function testNoDB() {
		$pipeline = $this->getDummyPipeline(false);

		// Start failure
		$pipeline->markFailed();
		$step = $pipeline->RollbackStep1();

		// Assert not error at startup
		$this->assertEquals('Started', $step->Status);
		$this->assertEquals('Deployment', $step->Doing);

		// Mark the service as completed and check result
		$deployment = $step->RollbackDeployment();
		$deployment->markFinished();

		// Re-enter step as if called from checkPipelineStatus
		PipelineTest_MockLog::clear();
		$step->start();

		$this->assertEquals('Finished', $step->Status);
	}

	/**
	 * Test failure at the snapshot step
	 */
	public function testSnapshotFailure() {
		$pipeline = $this->getDummyPipeline();

		// Start failure
		$pipeline->markFailed();
		$step = $pipeline->RollbackStep1();

		// Assert not error at startup
		$this->assertEquals('Started', $step->Status);
		$this->assertEquals('Deployment', $step->Doing);

		// Mark the service as completed and check result
		$deployment = $step->RollbackDeployment();
		$deployment->markFinished();

		// Re-enter step as if called from checkPipelineStatus
		PipelineTest_MockLog::clear();
		$step->start();

		$this->assertEquals('Started', $step->Status);
		$this->assertEquals('Snapshot', $step->Doing);

		// Mark the snapshot as completed and check result
		$snapshot = $step->RollbackDatabase();
		$snapshot->markFailed();

		// Re-enter step as if called from checkPipelineStatus
		PipelineTest_MockLog::clear();
		$step->start();

		$this->assertEquals('Failed', $step->Status);
	}

	/**
	 * Test failure at the deployment step
	 */
	public function testDeploymentFailure() {
		$pipeline = $this->getDummyPipeline();

		// Start failure
		$pipeline->markFailed();
		$step = $pipeline->RollbackStep1();

		// Assert not error at startup
		$this->assertEquals('Started', $step->Status);
		$this->assertEquals('Deployment', $step->Doing);

		// Mark the service as completed and check result
		$deployment = $step->RollbackDeployment();
		$deployment->markFailed();

		// Confirm that the maintenance page is not disabled
		$this->assertNotLogged('Maintenance page disabled');
	}
}
