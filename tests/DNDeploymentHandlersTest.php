<?php

use Finite\Event\TransitionEvent;

class DNDeploymentHandlersTest extends \SapphireTest {

	protected $usesDatabase = true;

	public function tearDown() {
		\Mockery::close();
		parent::tearDown();
	}

	public function testOnSubmitSendsEmailToApprover() {
		$deployer = Member::create();
		$deployer->Name = "Carl Deployer";
		$deployer->Email = 'carldeployer@localhost';
		$deployer->write();

		$approver = Member::create();
		$approver->Name = 'Joe Approver';
		$approver->Email = 'joeapprover@localhost';
		$approver->write();

		$deployment = DNDeployment::create();
		$deployment->DeployerID = $deployer->ID;
		$deployment->ApproverID = $approver->ID;
		$deployment->log = \Mockery::mock('someLog')->shouldIgnoreMissing();
		$deployment->write();

		$event = \Mockery::mock('Finite\Event\TransitionEvent', [
			'getStateMachine->getObject' => $deployment,
		]);

		$handlers = new DNDeploymentHandlers();
		$handlers->onSubmit($event);

		$expectedTo = sprintf("%s <%s>", $approver->Name, $approver->Email);
		$expectedFrom = Config::inst()->get('Email', 'admin_email');
		$this->assertEmailSent($expectedTo, $expectedFrom, 'Deployment has been submitted');

		$email = $this->findEmail($expectedTo);
		$this->assertContains($approver->FirstName, $email['content']);
		$this->assertContains($deployer->Email, $email['content']);
	}

	public function testOnQueueTriggersJob() {
		$deployment = \Mockery::mock('DNDeployment', [
			'log' => \Mockery::mock('someLog')->shouldIgnoreMissing(),
			'write' => null,
			'getSigFile' => '/tmp/__test',
			// we mock theses two below because SS calls this for updates on DB properties
			// and in this test case we don't care that datetime values have been updated
			'hasMethod' => false,
			'setField' => null,
		]);
		$machine = \Mockery::mock('Finite\StateMachine', [
			'getObject' => $deployment,
		]);
		$event = \Mockery::mock('Finite\Event\TransitionEvent', [
			'getStateMachine' => $machine,
		]);

		$deployment->shouldReceive('enqueueDeployment')->once()->andReturn('123');
		$deployment->shouldReceive('setResqueToken')->once()->with('123');

		$handlers = new DNDeploymentHandlers();
		$handlers->onQueue($event);

		$this->assertTrue(true);
	}

	public function testOnAbortSendsSignal() {
		$deployment = \Mockery::mock('DNDeployment');
		$event = \Mockery::mock('Finite\Event\TransitionEvent', [
			'getStateMachine->getObject' => $deployment,
		]);

		$deployment->shouldReceive('setSignal')->once()->with(2);

		$handlers = new DNDeploymentHandlers();
		$handlers->onAbort($event);

		$this->assertTrue(true);
	}

}
