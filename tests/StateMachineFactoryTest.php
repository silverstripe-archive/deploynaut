<?php

class StateMachineFactoryTest extends PHPUnit_Framework_TestCase {

	public function tearDown() {
		\Mockery::close();
	}

	public function testForDNDeploymentHooksUpHandlers() {
		$deployment = \Mockery::mock('DNDeployment')->shouldIgnoreMissing();
		$dispatcher = \Mockery::mock('Symfony\Component\EventDispatcher\EventDispatcherInterface');
		$machine = \Mockery::mock('Finite\StateMachine\StateMachine', [
			'getDispatcher' => $dispatcher,
			'getObject' => $deployment,
		])->shouldIgnoreMissing();
		$handler = \Mockery::mock('someHandlerClass');

		Injector::inst()->registerService($handler, 'someHandlerClass');
		Injector::inst()->registerService($machine, 'Finite\StateMachine\StateMachine');

		Config::inst()->update('StateMachineFactory', 'handlers', [
			get_class($deployment) => [
				'arbitraryTransition' => [
					'someHandlerClass' => 'hookMethod'
				]
			]
		]);

		$dispatcher->shouldReceive('addListener')->once()->with(
			'finite.post_transition',
			[Injector::inst()->get('DNDeploymentHandlers'), 'onAfterTransition']
		);

		$dispatcher->shouldReceive('addListener')->once()->with(
			'finite.post_transition.arbitraryTransition',
			[$handler, 'hookMethod']
		);

		$factory = new StateMachineFactory();
		$factory->forDNDeployment($deployment);

		$this->assertTrue(true);
	}

}
