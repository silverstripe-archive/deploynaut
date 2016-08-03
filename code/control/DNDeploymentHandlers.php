<?php

use \Finite\Event\TransitionEvent;

class DNDeploymentHandlers extends Object {

	public function onSubmit(TransitionEvent $e) {
		$deployment = $e->getStateMachine()->getObject();
		$this->sendEmailToApprover($deployment);
	}

	protected function sendEmailToApprover(DNDeployment $deployment) {
		$deployer = $deployment->Deployer();
		$approver = $deployment->Approver();
		if (!$approver || !$approver->exists()) {
			return false;
		}

		$email = Injector::inst()->get('Email');
		$email->setTo(sprintf('%s <%s>', $approver->Name, $approver->Email));
		$email->replyTo(sprintf('%s <%s>', $deployer->Name, $deployer->Email));
		$email->setSubject('Deployment has been submitted');
		$email->setTemplate('DeploymentNotificationSubmitted');
		$email->populateTemplate($deployment);
		$email->send();

		$log = $deployment->log();
		$log->write(sprintf(
			'Deployment submitted email sent to approver %s <%s>',
			$approver->Name,
			$approver->Email
		));
	}

	public function onQueue(TransitionEvent $e) {
		$deployment = $e->getStateMachine()->getObject();

		$token = $deployment->enqueueDeployment();
		$deployment->setResqueToken($token);
		$deployment->write();

		$log = $deployment->log();
		$log->write(sprintf(
			'Deploy queued as job %s (sigFile is %s)',
			$token,
			$deployment->getSigFile()
		));
	}

	public function onAbort(TransitionEvent $e) {
		$deployment = $e->getStateMachine()->getObject();

		// 2 is SIGINT - we can't use SIGINT constant in the mod_apache context.
		$deployment->setSignal(2);
	}
}
