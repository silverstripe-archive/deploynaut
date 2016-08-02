<?php

use Finite\StateMachine\StateMachine;

class DNDeploymentDispatcher extends Dispatcher {

	const ALLOW_DNDEPLOYMENT_SUBMIT = 'ALLOW_DNDEPLOYMENT_SUBMIT';
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
		$deployment = $this->getDeployment();
		if (!$deployment) {
			return [];
		}

		return [
			'State' => $deployment->State
		];
	}

	public function getDeployment() {
		$id = $this->request->param('Id');
		$deployment = DNDeployment::get()->byId($id);
		if (!$deployment || !$deployment->exists()) {
			return false;
		}
		return $deployment;
	}

	public function apply(SS_HTTPRequest $request) {
		$this->checkSecurityToken();
		$response = $this->checkRequest();
		if ($response instanceof SS_HTTPResponse) {
			return $response;
		}

		$machine = $this->getMachine();
		$machine->apply($request->param('State'));

		$model = $this->getModel('DNDeployment');
		return $this->asJSON($model);
	}

	public function canApply(SS_HTTPRequest $request) {
		$this->checkSecurityToken();
		$response = $this->checkRequest();
		if ($response instanceof SS_HTTPResponse) {
			return $response;
		}

		return $this->asJSON([
			'Can' => $this->getMachine()->can($request->param('State'))
		]);
	}

	protected function checkRequest() {
		$project = $this->getCurrentProject();
		if(!$project) {
			return $this->project404Response();
		}

		$env = $this->getCurrentEnvironment($project);
		if(!$env) {
			return $this->environment404Response();
		}

		$deployment = $this->getDeployment();
		if (!$deployment) {
			return new SS_HTTPResponse('Deployment not found', 404);
		}

		return true;
	}

	protected function getMachine() {
		$deployment = $this->getDeployment();
		if (!$deployment) {
			return null;
		}

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
				case DNDeployment::TR_SUBMIT:
					$code = self::ALLOW_DNDEPLOYMENT_SUBMIT;
					break;
				case DNDeployment::TR_QUEUE:
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
