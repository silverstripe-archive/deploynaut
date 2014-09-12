<?php

class AbstractPipelineTest extends PipelineTest {

	// Fixture file containing test pipeline data
	protected static $fixture_file = 'AbstractPipelineTest.yml';

	public function testCheckPipelineStatus() {
		$pipeline = $this->objFromFixture('Pipeline', 'Pipe2');
		$pipeline->Config = serialize(array());
		$pipeline->write();

		// First step should start.
		$pipeline->checkPipelineStatus();

		$this->assertEquals('Running', $pipeline->Status);
		$this->assertEquals(true, $pipeline->isRunning());
		$this->assertDOSEquals(array(
			array('Name'=>'step1', 'Status'=>'Started'),
			array('Name'=>'step2', 'Status'=>'Queued'),
		), $pipeline->Steps());

		// Try to progress the pipeline second time. Shouldn't move until step is finished.
		$pipeline->checkPipelineStatus();
		$this->assertEquals('Running', $pipeline->Status);
		$this->assertEquals(true, $pipeline->isRunning());
		$this->assertDOSEquals(array(
			array('Name'=>'step1', 'Status'=>'Started'),
			array('Name'=>'step2', 'Status'=>'Queued'),
		), $pipeline->Steps());

		// First step finished, pipeline should move now.
		$firstStep = $pipeline->CurrentStep();
		$firstStep->Status = 'Finished';
		$firstStep->write();
		$pipeline->checkPipelineStatus();

		$this->assertEquals('Running', $pipeline->Status);
		$this->assertEquals(true, $pipeline->isRunning());
		$this->assertDOSEquals(array(
			array('Name'=>'step1', 'Status'=>'Finished'),
			array('Name'=>'step2', 'Status'=>'Started'),
		), $pipeline->Steps());

		// Last step finished. Pipeline should fold now.
		$lastStep = $pipeline->CurrentStep();
		$lastStep->Status = 'Finished';
		$lastStep->write();
		$pipeline->checkPipelineStatus();

		$this->assertEquals('Complete', $pipeline->Status);
		$this->assertEquals(false, $pipeline->isRunning());
		$this->assertDOSEquals(array(
			array('Name'=>'step1', 'Status'=>'Finished'),
			array('Name'=>'step2', 'Status'=>'Finished'),
		), $pipeline->Steps());
	}

	public function testAborted() {
		$pipeline = $this->objFromFixture('Pipeline', 'Pipe1');
		$pipeline->Config = serialize(array());
		$pipeline->write();

		$pipeline->markAborted();

		// confirm Status is now aborted
		$this->assertEquals('Aborted', $pipeline->Status);
		$this->assertEquals(true, $pipeline->isAborted());

		// Confirm steps have correct status.
		$this->assertDOSEquals(array(
			array('Name'=>'step1', 'Status'=>'Finished'),
			array('Name'=>'step2', 'Status'=>'Aborted'),
			array('Name'=>'step3', 'Status'=>'Aborted')
		), $pipeline->Steps());
	}

	public function testAbortPipelineLink() {
		$pipeline = $this->objFromFixture('Pipeline', 'Pipe1');

		// Confirm the correct abort link is generated
		$this->assertEquals($pipeline->Link('abort'),
			'naut/project/Project 1/environment/env1/pipeline/'.$pipeline->ID.'/abort');
	}

	public function testCanCancelPipeline() {
		$member = $this->objFromFixture('Member', 'Deployer2');
		$member->logIn();
		$pipeline = $this->objFromFixture('Pipeline', 'Pipe1');

		$environment = $pipeline->Environment();

		// confirm Status is now running
		$this->assertEquals('Running', $pipeline->Status);

		// confirm non-admin member who did not start the pipeline cannot stop it
		$this->assertEquals(false, $environment->CanCancelPipeline());

		// confirm member who started pipeline can stop it
		$member = $this->objFromFixture('Member', 'Deployer1');
		$member->logIn();
		$this->assertEquals(true, $environment->CanCancelPipeline());

		// confirm admin member can stop pipeline
		$member = $this->objFromFixture('Member', 'Deployer3');
		$member->logIn();
		$this->assertEquals(true, $environment->CanCancelPipeline());
	}

	public function testMarkFailed() {
		$pipeline = $this->objFromFixture('Pipeline', 'Pipe1');
		$pipeline->Config = serialize(array());
		$pipeline->write();

		// Pretend second step fails.
		$step = $this->objFromFixture('PipelineStep', 'Step2');
		$step->Status = 'Failed';
		$step->write();
		$pipeline->markFailed();

		// confirm Status is now Failed.
		$this->assertEquals('Failed', $pipeline->Status);
		$this->assertEquals(true, $pipeline->isFailed());

		// Confirm steps have correct status.
		$this->assertDOSEquals(array(
			array('Name'=>'step1', 'Status'=>'Finished'),
			array('Name'=>'step2', 'Status'=>'Failed'),
			array('Name'=>'step3', 'Status'=>'Aborted')
		), $pipeline->Steps());
	}

	/**
	 * Provide rollback-able pipeline on the verge of failing.
	 */
	public function getFailingPipeline() {
		// Get default backups
		$previous = DNDeployment::create();
		$previous->SHA = '9f0a012e97715b1871n41gk30f34268u12a0029q';
		$previous->write();
		$current = DNDeployment::create();
		$current->write();
		$snapshot = DNDataTransfer::create();
		$snapshot->write();

		$pipeline = $this->objFromFixture('Pipeline', 'FailingPipe');
		$pipeline->Config = serialize(array(
			'RollbackStep1' => array(
				'Class' => 'RollbackStep',
				'RestoreDB' => false,
				'MaxDuration' => '3600'
			),
			'RollbackStep2' => array(
				'Class' => 'SmokeTestPipelineStep',
				'MaxDuration' => '3600'
			)
		));
		$pipeline->PreviousDeploymentID = $previous->ID;
		$pipeline->CurrentDeploymentID = $current->ID;
		$pipeline->PreviousSnapshotID = $snapshot->ID;
		$pipeline->write();

		return $pipeline;
	}

	public function testMarkFailedRollbackStart() {

		$pipeline = $this->getFailingPipeline();
		$this->assertEquals($pipeline->RollbackStep1ID, 0);
		$this->assertEquals($pipeline->RollbackStep2ID, 0);
		$this->assertFalse($pipeline->isFailed());
		$this->assertFalse($pipeline->isRollback());

		$pipeline->markFailed();

		$this->assertNotEmpty($pipeline->RollbackStep1());
		$this->assertNotEmpty($pipeline->RollbackStep2());
		$this->assertFalse($pipeline->isFailed());
		$this->assertTrue($pipeline->isRollback());
		$this->assertHasLog('Beginning rollback...');
		$this->assertEquals($pipeline->RollbackStep1()->Status, 'Started');
		$this->assertEquals($pipeline->RollbackStep2()->Status, 'Queued');

	}

	public function testMarkFailedRollbackFailing() {

		$pipeline = $this->getFailingPipeline();

		// Trigger rollback.
		$pipeline->markFailed();

		// Fail first rollback step.
		$pipeline->RollbackStep1()->markFailed();

		$this->assertHasLog('Pipeline failed, rollback failed.');

		$pipeline = Pipeline::get()->byID($pipeline->ID);
		$this->assertTrue($pipeline->isFailed());
		$this->assertFalse($pipeline->isRollback());
		$this->assertEquals($pipeline->RollbackStep1()->Status, 'Failed');
		$this->assertEquals($pipeline->RollbackStep2()->Status, 'Aborted');
		$this->assertEquals($pipeline->Status, 'Failed');

	}

	public function testMarkCompleteRollback() {

		$pipeline = $this->getFailingPipeline();

		// Trigger rollback.
		$pipeline->markFailed();

		// Succeed the rollback.
		$pipeline->RollbackStep1()->finish();
		$pipeline->RollbackStep2()->finish();

		// Progress the pipeline. Will call markFailed.
		$pipeline->checkPipelineStatus();

		$this->assertHasLog('Pipeline failed, but rollback completed successfully.');

		$pipeline = Pipeline::get()->byID($pipeline->ID);
		$this->assertTrue($pipeline->isFailed());
		$this->assertFalse($pipeline->isRollback());
		$this->assertEquals($pipeline->RollbackStep1()->Status, 'Finished');
		$this->assertEquals($pipeline->RollbackStep2()->Status, 'Finished');
		$this->assertEquals($pipeline->Status, 'Failed');

	}
}
