<?php

use Finite\Event\TransitionEvent;

class DNDeploymentHandlersTest extends PHPUnit_Framework_TestCase {

	public function tearDown() {
		\Mockery::close();
	}

	public function testOnSubmitSendsEmailToApprover() {
		$deployer = \Mockery::mock('someDeployer')->shouldIgnoreMissing();
		$deployer->Name = null;
		$deployer->Email = null;

		$approver = \Mockery::mock('someApprover', [
			'exists' => true,
		])->shouldIgnoreMissing();
		$approver->Name = 'Mr. Approver';
		$approver->Email = 'mrapprover@localhost';

		$deployment = \Mockery::mock('DNDeployment', [
			'Deployer' => $deployer,
			'Approver' => $approver,
			'log' => \Mockery::mock('someLog')->shouldIgnoreMissing(),
		]);

		$event = \Mockery::mock('Finite\Event\TransitionEvent', [
			'getStateMachine->getObject' => $deployment,
		]);

		$email = \Mockery::mock('Email', [
			'replyTo' => null,
			'setSubject' => null,
			'setTemplate' => null,
			'populateTemplate' => null,
		]);

		// Flip to singleton so we can form expectations.
		Config::inst()->update('Injector', 'Email', null);
		Injector::inst()->registerService($email, 'Email');

		$email->shouldReceive('setTo')->with('Mr. Approver <mrapprover@localhost>')->once();
		$email->shouldReceive('send')->once();

		$handlers = new DNDeploymentHandlers();
		$handlers->onSubmit($event);

		$this->assertTrue(true);
	}

	public function testOnQueueTriggersJob() {
		$deployment = \Mockery::mock('DNDeployment', [
			'log' => \Mockery::mock('someLog')->shouldIgnoreMissing(),
			'write' => null,
			'getSigFile' => '/tmp/__test',
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
