<?php

use Finite\StateMachine\StateMachine;

class DNDeploymentDispatcher extends Dispatcher {

	const ALLOW_DNDEPLOYMENT_APPROVE = 'ALLOW_DNDEPLOYMENT_APPROVE';
	const ALLOW_DNDEPLOYMENT_QUEUE = 'ALLOW_DNDEPLOYMENT_QUEUE';

	private static $allowed_actions = [
		'apply',
		'canApply',
	];

	private static $url_handlers = [
		'$Id/apply/$State' => 'apply',
		'$Id/can/$State' => 'canApply',
	];

	public function getModel($name) {
		$id = $this->request->param('Id');
		$deployment = DNDeployment::get()->byId($id);
		return [
			'State' => $deployment->State
		];
	}

	public function apply(SS_HTTPRequest $request) {
		$this->checkSecurityToken();

		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		$env = $this->getCurrentEnvironment($project);
		if(!$env) {
			return $this->environment404Response();
		}

		$machine = $this->getMachine();
		$machine->apply($request->param('State'));

		$model = $this->getModel('DNDeployment');
		return $this->asJSON($model);
	}

	public function canApply(SS_HTTPRequest $request) {
		$this->checkSecurityToken();

		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		$env = $this->getCurrentEnvironment($project);
		if(!$env) {
			return $this->environment404Response();
		}

		return $this->asJSON([
			'Can' => $this->getMachine()->can($request->param('State'))
		]);
	}

	protected function getMachine() {
		$id = $this->request->param('Id');
		$deployment = DNDeployment::get()->byId($id);
		$project = $deployment->Environment()->Project();
		$machine = $deployment->getMachine();

		$machine->getDispatcher()->addListener(
			// Global hook which runs before any transition is actually done.
			// It gives a chance to perform a dry-run, and reject the transition, for example
			// in case the user is unauthorised.
			'finite.test_transition',
			function (Finite\Event\TransitionEvent $e) use ($project) {
				$code = null;

				switch ($e->getTransition()->getName()) {
				case 'approve':
					$code = self::ALLOW_DNDEPLOYMENT_APPROVE;
					break;
				case 'queue':
					$code = self::ALLOW_DNDEPLOYMENT_QUEUE;
					break;
				}

				if (!$code || !$project->allowed($code)) {
					$e->reject();
				}
			}
		);

		return $machine;
	}

}
