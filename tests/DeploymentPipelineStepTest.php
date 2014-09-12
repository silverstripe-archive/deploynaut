<?php

class DeploymentPipelineStepTest extends PipelineTest {

	protected static $fixture_file = 'PipelineTest.yml';

	public function setUp() {
		parent::setUp();
		Injector::inst()->load(array(
			'DNDeployment' => 'DeploymentPipelineStepTest_DNDeployment',
			'DNDataTransfer' => 'DeploymentPipelineStepTest_DNDataTransfer'
		));
	}

	/**
	 * Makse the dummy deployment step
	 *
	 * @return DeploymentPipelineStep
	 */
	public function getDummyDeployment() {
		$deployStep = $this->objFromFixture('DeploymentPipelineStep', 'testdeploy');
		$deployStep->Config = serialize(array('MaxDuration' => '3600'));
		$deployStep->write();
		$pipeline = $deployStep->Pipeline();
		$pipeline->Config = serialize(array());
		$pipeline->write();
		return $deployStep;
	}

	public function testSuccessful() {
		$step = $this->getDummyDeployment();
		$step->start();

		// Assert not error at startup
		$this->assertEquals('Started', $step->Status);
		$this->assertEquals('Snapshot', $step->Doing);
		$this->assertTrue(PipelineTest_MockLog::has_message('TestDeployStep:Snapshot creating snapshot of database'));

		// Mark the snapshot as completed and check result
		$snapshot = $step->Pipeline()->PreviousSnapshot();
		$snapshot->markFinished();

		// Retry step
		PipelineTest_MockLog::clear();
		$step->start();

		$this->assertEquals('Started', $step->Status);
		$this->assertEquals('Deployment', $step->Doing);
		$this->assertTrue(PipelineTest_MockLog::has_message('TestDeployStep:Deployment starting deployment'));

		// Mark the service as completed and check result
		$deployment = $step->Pipeline()->CurrentDeployment();
		$deployment->markFinished();

		// Retry step
		PipelineTest_MockLog::clear();
		$step->start();
		$this->assertEquals('Finished', $step->Status);
		$this->assertTrue(PipelineTest_MockLog::has_message('Checking status of TestDeployStep:Deployment...'));
		$this->assertTrue(PipelineTest_MockLog::has_message('Step finished successfully!'));
	}

	/**
	 * Test failure at the snapshot step
	 */
	public function testSnapshotFailure() {
		$step = $this->getDummyDeployment();
		$step->start();

		// Assert not error at startup
		$this->assertEquals('Started', $step->Status);
		$this->assertEquals('Snapshot', $step->Doing);
		$this->assertTrue(PipelineTest_MockLog::has_message('TestDeployStep:Snapshot creating snapshot of database'));

		// Mark the service as completed and check result
		$snapshot = $step->Pipeline()->PreviousSnapshot();
		$snapshot->markFailed();

		// Retry step
		PipelineTest_MockLog::clear();
		$step->start();
		$this->assertEquals('Failed', $step->Status);
		$this->assertTrue(PipelineTest_MockLog::has_message('Checking status of TestDeployStep:Snapshot...'));
		$this->assertTrue(PipelineTest_MockLog::has_message('TestDeployStep:Snapshot failed with task status Failed'));
	}

	/**
	 * Test failure at the deployment step
	 */
	public function testDeploymentFailure() {
		$step = $this->getDummyDeployment();
		$step->start();

		// Assert not error at startup
		$this->assertEquals('Started', $step->Status);
		$this->assertEquals('Snapshot', $step->Doing);
		$this->assertTrue(PipelineTest_MockLog::has_message('TestDeployStep:Snapshot creating snapshot of database'));

		// Mark the snapshot as completed and check result
		$snapshot = $step->Pipeline()->PreviousSnapshot();
		$snapshot->markFinished();

		// Retry step
		PipelineTest_MockLog::clear();
		$step->start();

		$this->assertEquals('Started', $step->Status);
		$this->assertEquals('Deployment', $step->Doing);
		$this->assertTrue(PipelineTest_MockLog::has_message('TestDeployStep:Deployment starting deployment'));

		// Mark the service as completed and check result
		$deployment = $step->Pipeline()->CurrentDeployment();
		$deployment->markFailed();

		// Retry step
		PipelineTest_MockLog::clear();
		$step->start();
		$this->assertEquals('Failed', $step->Status);
		$this->assertTrue(PipelineTest_MockLog::has_message('Checking status of TestDeployStep:Deployment...'));
		$this->assertTrue(PipelineTest_MockLog::has_message('TestDeployStep:Deployment failed with task status Failed'));
	}

	public function testDelayedSuccess() {
		$step = $this->getDummyDeployment();
		$step->start();

		// Assert not error at startup
		$this->assertEquals('Started', $step->Status);
		$this->assertEquals('Snapshot', $step->Doing);
		$this->assertTrue(PipelineTest_MockLog::has_message('TestDeployStep:Snapshot creating snapshot of database'));

		// Retry step
		PipelineTest_MockLog::clear();
		$step->start();
		$this->assertEquals('Started', $step->Status);
		$this->assertEquals('Snapshot', $step->Doing);
		$this->assertTrue(PipelineTest_MockLog::has_message('Checking status of TestDeployStep:Snapshot...'));
		$this->assertTrue(PipelineTest_MockLog::has_message('TestDeployStep:Snapshot is still in progress'));

		// Mark the snapshot as completed and check result
		$snapshot = $step->Pipeline()->PreviousSnapshot();
		$snapshot->markFinished();

		// Advance to deployment
		PipelineTest_MockLog::clear();
		$step->start();
		$this->assertEquals('Started', $step->Status);
		$this->assertEquals('Deployment', $step->Doing);
		$this->assertTrue(PipelineTest_MockLog::has_message('TestDeployStep:Deployment starting deployment'));

		// Retry step
		PipelineTest_MockLog::clear();
		$step->start();
		$this->assertEquals('Started', $step->Status);
		$this->assertEquals('Deployment', $step->Doing);
		$this->assertTrue(PipelineTest_MockLog::has_message('Checking status of TestDeployStep:Deployment...'));
		$this->assertTrue(PipelineTest_MockLog::has_message('TestDeployStep:Deployment is still in progress'));

		// Mark the service as completed and check result
		$deployment = $step->Pipeline()->CurrentDeployment();
		$deployment->markFinished();

		// Retry step
		PipelineTest_MockLog::clear();
		$step->start();
		$this->assertEquals('Finished', $step->Status);
		$this->assertTrue(PipelineTest_MockLog::has_message('Checking status of TestDeployStep:Deployment...'));
		$this->assertTrue(PipelineTest_MockLog::has_message('Step finished successfully!'));
	}

	public function testTimeout() {
		$step = $this->getDummyDeployment();
		$step->start();

		// Assert not error at startup
		$this->assertEquals('Started', $step->Status);
		$this->assertTrue(PipelineTest_MockLog::has_message('TestDeployStep:Snapshot creating snapshot of database'));

		// Go to two hours into the future
		SS_Datetime::set_mock_now(date('Y-m-d H:i:s', strtotime('+2 hours')));

		// Retry step
		PipelineTest_MockLog::clear();
		$step->start();
		$this->assertEquals('Failed', $step->Status);
		$this->assertTrue($step->isTimedOut());
		$this->assertTrue(PipelineTest_MockLog::has_message('Checking status of TestDeployStep:Snapshot...'));
		$this->assertTrue(PipelineTest_MockLog::has_message(
			'TestDeployStep:Snapshot took longer than 3600 seconds to run and has timed out'
		));
	}
}

/**
 * Dummy deployment service
 */
class DeploymentPipelineStepTest_DNDeployment extends DNDeployment implements TestOnly {

	public function getSHA() {
		$sha = parent::getField('SHA');
		return $sha ?: '9ae502821345ab39b04d46ce6bb822ccdd7f7414';
	}

	public function start() {
		$this->Status = 'Queued';
		$this->write();
	}

	public function markFinished() {
		$this->Status = 'Finished';
		$this->write();
	}

	public function markFailed() {
		$this->Status = 'Failed';
		$this->write();
	}

	public function ResqueStatus() {
		// Just lie, remembering to map 'Finished' to 'Complete'
		return $this->Status === 'Finished' ? 'Complete' : $this->Status;
	}
}

class DeploymentPipelineStepTest_DNDataTransfer extends DNDataTransfer implements TestOnly {

	public function start() {
		$this->Status = 'Queued';
	}

	public function markFinished() {
		$this->Status = 'Finished';
		$this->write();
	}

	public function markFailed() {
		$this->Status = 'Failed';
		$this->write();
	}

	public function ResqueStatus() {
		// Just lie, remembering to map 'Finished' to 'Complete'
		return $this->Status === 'Finished' ? 'Complete' : $this->Status;
	}
}
