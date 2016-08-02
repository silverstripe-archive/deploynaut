<?php

use \Finite\Event\TransitionEvent;

class DNDeploymentHandlers extends Object {
	public function onQueue(TransitionEvent $e) {
		$obj = $e->getStateMachine()->getObject();

		$log = $obj->log();
		$token = $obj->enqueueDeployment();
		$obj->ResqueToken = $token;
		$obj->write();

		$message = sprintf(
			'Deploy queued as job %s (sigFile is %s)',
			$token,
			DeployJob::sig_file_for_data_object($obj)
		);
		$obj->write($message);
	}

	public function onAbort(TransitionEvent $e) {
		$obj = $e->getStateMachine()->getObject();

		// 2 is SIGINT - we can't use SIGINT constant in the mod_apache context.
		DeployJob::set_signal($obj, 2);
	}
}
