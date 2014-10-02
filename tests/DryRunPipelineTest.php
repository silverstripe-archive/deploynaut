<?php

class DryRunPipelineTest extends PipelineTest {

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
		$pipeline->DryRun = true;
		$pipeline->write();

		return $pipeline;
	}

	/**
	 * Makes the dummy deployment step
	 *
	 * @return DeploymentPipelineStep
	 */
	public function getDummyDeployment() {
		$deployStep = $this->objFromFixture('DeploymentPipelineStep', 'testdeploy');
		$deployStep->Config = serialize(array('MaxDuration' => '3600'));
		$deployStep->write();
		$pipeline = $deployStep->Pipeline();
		$pipeline->Config = serialize(array());
		$pipeline->DryRun = true;
		$pipeline->write();
		return $deployStep;
	}

	/**
	 * @return RollbackStep
	 */
	public function getDummyRollback() {
		$rollbackStep = RollbackStep::create();
		$rollbackStep->Status = 'Queued';
		$rollbackStep->Doing = 'Queued';
		$rollbackStep->Config = serialize(array(
			'Class' => 'RollbackStep',
			'MaxDuration' => '3600',
			'RestoreDB' => true
		));
		$rollbackStep->write();
		$pipeline = $this->getDummyPipeline();
		$pipeline->RollbackStep1 = $rollbackStep->ID;
		$rollbackStep->PipelineID = $pipeline->ID;
		$rollbackStep->write();
		$pipeline->write();
		return $rollbackStep;

	}

	/**
	 * Test messages aren't sent
	 */
	public function testMessages() {
		$pipeline = $this->getDummyPipeline();
		$sender = new EmailMessagingService();
		$sender->sendMessage($pipeline, 'Test message', 'noreply@example.com');
		$this->assertHasLog('[Skipped] Sent message to noreply@example.com (subject: Deploynaut notification)');
	}

	/**
	 * Test deployments dont do anything
	 */
	public function testDeployment() {
		$step = $this->getDummyDeployment();

		// First run; creates snapshot
		$step->start();
		$this->assertHasLog('TestDeployStep:Snapshot creating snapshot of database');
		$this->assertHasLog('[Skipped] Create DNDataTransfer backup');


		// Second run, finalises snapshot and creates deployment
		PipelineTest_MockLog::clear();
		$step->start();
		$this->assertHasLog('Checking status of TestDeployStep:Snapshot...');
		$this->assertHasLog('[Skipped] Checking progress of snapshot backup');
		$this->assertHasLog('TestDeployStep:Deployment starting deployment');
		$this->assertHasLog('[Skipped] Create DNDeployment for SHA 9ae502821345ab39b04d46ce6bb822ccdd7f7414');

		// Third run, complete deployment
		PipelineTest_MockLog::clear();
		$step->start();
		$this->assertHasLog('Checking status of TestDeployStep:Deployment...');
		$this->assertHasLog('[Skipped] Checking progress of deployment');
	}

	/**
	 * Test the rollback step
	 */
	public function testRollback() {
		$step = $this->getDummyRollback();

		// First run, start revert code
		$step->start();
		$this->assertHasLog('RollbackStep:Deployment starting revert deployment');
		$this->assertHasLog('[Skipped] Create DNDeployment');

		// Second run, finish deployment and start database restoration
		PipelineTest_MockLog::clear();
		$step->start();
		$this->assertHasLog('Checking status of RollbackStep:Deployment...');
		$this->assertHasLog('[Skipped] Checking progress of deployment');
		$this->assertHasLog('RollbackStep:Snapshot reverting database from snapshot');
		$this->assertHasLog('[Skipped] Create DNDataTransfer restore');

		// Third run, complete snapshot restore
		PipelineTest_MockLog::clear();
		$step->start();
		$this->assertHasLog('Checking status of RollbackStep:Snapshot...');
		$this->assertHasLog('[Skipped] Checking progress of snapshot restore');
		$this->assertHasLog('Step finished successfully!');
	}

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
		$pipeline->DryRun = true;
		$pipeline->write();
		$smokeStep->Config = serialize($pipeline->getConfigSetting('Steps', $name));
		$smokeStep->write();
		return $smokeStep;
	}

	/**
	 * Test failed smoke test
	 */
	public function testSmokeTestFail() {
		// the testsmokefaile yml config contains a invalid smoketest url
		// which is how it fails
		$step = $this->getDummySmokeTestStep('FailTest');
		$step->start();
		$this->assertHasLog('Starting smoke test "BrokenPage" to URL http://bob.bob.bob.bob/');
		$this->assertHasLog('Curl error: ');
		$this->assertHasLog('[Skipped] Smoke testing failed: Putting up emergency maintenance page');
	}
}
