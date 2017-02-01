<?php

use Finite\State\StateInterface;

class StateMachineFactory extends Object {

	private static $handlers = [];

	public function forDNDeployment(\DNDeployment $obj) {
		$loader = new Finite\Loader\ArrayLoader([
			'class'   => 'DNDeployment',
			'states'  => [
				DNDeployment::STATE_NEW => ['type' => StateInterface::TYPE_INITIAL],
				DNDeployment::STATE_SUBMITTED => ['type' => StateInterface::TYPE_NORMAL],
				DNDeployment::STATE_INVALID => ['type' => StateInterface::TYPE_NORMAL],
				DNDeployment::STATE_APPROVED => ['type' => StateInterface::TYPE_NORMAL],
				DNDeployment::STATE_REJECTED => ['type' => StateInterface::TYPE_NORMAL],
				DNDeployment::STATE_QUEUED => ['type' => StateInterface::TYPE_NORMAL],
				DNDeployment::STATE_DEPLOYING => ['type' => StateInterface::TYPE_NORMAL],
				DNDeployment::STATE_ABORTING => ['type' => StateInterface::TYPE_NORMAL],
				DNDeployment::STATE_COMPLETED => ['type' => StateInterface::TYPE_FINAL],
				DNDeployment::STATE_FAILED => ['type' => StateInterface::TYPE_FINAL],
				DNDeployment::STATE_DELETED => ['type' => StateInterface::TYPE_FINAL],
			],
			'transitions' => [
				DNDeployment::TR_NEW => ['from' => [DNDeployment::STATE_SUBMITTED], 'to' => DNDeployment::STATE_NEW],
				DNDeployment::TR_SUBMIT => ['from' => [DNDeployment::STATE_NEW], 'to' => DNDeployment::STATE_SUBMITTED],
				DNDeployment::TR_QUEUE => [
					'from' => [
						DNDeployment::STATE_NEW, // @deprecated. Remove this when DNRoot::startDeploy() is removed.
						DNDeployment::STATE_APPROVED
					],
					'to' => DNDeployment::STATE_QUEUED
				],
				DNDeployment::TR_INVALIDATE  => [
					'from' => [
						DNDeployment::STATE_NEW,
						DNDeployment::STATE_SUBMITTED,
						DNDeployment::STATE_APPROVED,
						DNDeployment::STATE_REJECTED
					],
					'to' => DNDeployment::STATE_INVALID
				],
				DNDeployment::TR_APPROVE => ['from' => [
						DNDeployment::STATE_NEW,
						DNDeployment::STATE_SUBMITTED
					],
					'to' => DNDeployment::STATE_APPROVED
				],
				DNDeployment::TR_REJECT => ['from' => [DNDeployment::STATE_SUBMITTED], 'to' => DNDeployment::STATE_REJECTED],
				DNDeployment::TR_DEPLOY => ['from' => [DNDeployment::STATE_QUEUED], 'to' => DNDeployment::STATE_DEPLOYING],
				DNDeployment::TR_ABORT => [
					'from' => [
						DNDeployment::STATE_QUEUED,
						DNDeployment::STATE_DEPLOYING,
						DNDeployment::STATE_ABORTING
					],
					'to' => DNDeployment::STATE_ABORTING
				],
				DNDeployment::TR_COMPLETE => ['from' => [DNDeployment::STATE_DEPLOYING], 'to' => DNDeployment::STATE_COMPLETED],
				DNDeployment::TR_FAIL  => [
					'from' => [
						DNDeployment::STATE_NEW,
						DNDeployment::STATE_SUBMITTED,
						DNDeployment::STATE_INVALID,
						DNDeployment::STATE_REJECTED,
						DNDeployment::STATE_APPROVED,
						DNDeployment::STATE_QUEUED,
						DNDeployment::STATE_DEPLOYING,
						DNDeployment::STATE_ABORTING
					],
					'to' => DNDeployment::STATE_FAILED
				],
				DNDeployment::TR_DELETE  => [
					'from' => [
						DNDeployment::STATE_NEW,
						DNDeployment::STATE_SUBMITTED,
						DNDeployment::STATE_INVALID,
						DNDeployment::STATE_APPROVED,
						DNDeployment::STATE_REJECTED,
					],
					'to' => DNDeployment::STATE_DELETED
				],
			]
		]);
		$stateMachine = Injector::inst()->get('Finite\StateMachine\StateMachine', true, [$obj]);

		// ensure the machine is initialised for this object, if it hasn't been already.
		if ($stateMachine->getCurrentState() === null) {
			$loader->load($stateMachine);
			$stateMachine->initialize();
			$this->addHandlers($stateMachine);
		}

		return $stateMachine;
	}

	protected function addHandlers($machine) {
		$class = get_class($machine->getObject());
		if (empty($this->config()->handlers[$class])) return;

		// this is the "internal" state listener that logs all state transitions
		$machine->getDispatcher()->addListener(
			'finite.post_transition',
			[Injector::inst()->get('DNDeploymentHandlers'), 'onAfterTransition']
		);

		$transitions = $this->config()->handlers[$class];
		foreach ($transitions as $transName => $handlers) {
			if (!is_array($handlers)) {
				throw new Exception(sprintf('Transition %s must be configured as an assoc array.', $transName));
			}

			foreach ($handlers as $handlerClass => $handlerMethod) {
				$handlerObj = Injector::inst()->get($handlerClass);
				if (!is_callable([$handlerObj, $handlerMethod])) {
					throw new Exception(sprintf('Handler %s is not callable on %s.', $handlerMethod, $handlerClass));
				}
				$machine->getDispatcher()->addListener(
					sprintf('finite.post_transition.%s', $transName),
					[$handlerObj, $handlerMethod]
				);
			}
		}
	}

}
