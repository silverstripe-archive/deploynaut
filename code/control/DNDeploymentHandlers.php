<?php

use \Finite\Event\TransitionEvent;

class DNDeploymentHandlers extends Object {

	public function onAfterTransition(TransitionEvent $e) {
		/** @var DNDeployment $deployment */
		$deployment = $e->getStateMachine()->getObject();
		$deployment->log()->write(sprintf(
			'State transitioned from "%s" to "%s"',
			$e->getInitialState()->getName(),
			$e->getTransition()->getState()
		));
	}

	public function onNew(TransitionEvent $e) {
		/** @var DNDeployment $deployment */
		$deployment = $e->getStateMachine()->getObject();
		$deployment->DeployRequested = null;
		$deployment->write();

		// If we transitioned from Submitted state, then send a cancellation email
		if ($e->getInitialState()->getName() === DNDeployment::STATE_SUBMITTED) {
			$this->sendApprovalCancellationEmail($deployment);
		}
	}

	public function onSubmit(TransitionEvent $e) {
		/** @var DNDeployment $deployment */
		$deployment = $e->getStateMachine()->getObject();
		$deployment->DeployRequested = SS_Datetime::now()->Rfc2822();
		$deployment->write();
		$this->sendSubmittedEmail($deployment);
	}

	public function onApprove(TransitionEvent $e) {
		// If we transitioned from Submitted state, then send an approved email.
		// This is especially important as bypassing goes from New to Approved, and we
		// don't want to be sending emails about approved when it was bypassed.
		if ($e->getInitialState()->getName() === DNDeployment::STATE_SUBMITTED) {
			$this->sendApprovedEmail($e->getStateMachine()->getObject());
		}
	}

	public function onReject(TransitionEvent $e) {
		// If we transitioned from Submitted state, then send an rejected email.
		if ($e->getInitialState()->getName() === DNDeployment::STATE_SUBMITTED) {
			$this->sendRejectedEmail($e->getStateMachine()->getObject());
		}
	}

	public function onQueue(TransitionEvent $e) {
		/** @var DNDeployment $deployment */
		$deployment = $e->getStateMachine()->getObject();

		$token = $deployment->enqueueDeployment();
		$deployment->setResqueToken($token);
		$deployment->DeployStarted = SS_Datetime::now()->Rfc2822();
		$deployment->write();

		$deployment->log()->write(sprintf(
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

	protected function canSendEmail(\DNDeployment $deployment) {
		$deployer = $deployment->Deployer();
		$approver = $deployment->Approver();
		if (!$deployer || !$deployer->exists()) {
			return false;
		}
		if (!$approver || !$approver->exists()) {
			return false;
		}

		return true;
	}

	protected function sendSubmittedEmail(\DNDeployment $deployment) {
		if (!$this->canSendEmail($deployment)) {
			return false;
		}
		$deployer = $deployment->Deployer();
		$approver = $deployment->Approver();

		$email = Email::create();
		$email->setTo(sprintf('%s <%s>', $approver->Name, $approver->Email));
		$email->replyTo(sprintf('%s <%s>', $deployer->Name, $deployer->Email));
		$email->setSubject(sprintf('%s has submitted a deployment for your approval', $deployer->Name));
		$email->setTemplate('DeploymentSubmittedEmail');
		$email->populateTemplate($deployment);
		$email->send();

		$deployment->log()->write(sprintf(
			'Deployment submitted email sent to approver %s <%s>',
			$approver->Name,
			$approver->Email
		));
	}

	protected function sendApprovedEmail(\DNDeployment $deployment) {
		if (!$this->canSendEmail($deployment)) {
			return false;
		}
		$deployer = $deployment->Deployer();
		$approver = $deployment->Approver();

		$email = Email::create();
		$email->setTo(sprintf('%s <%s>', $deployer->Name, $deployer->Email));
		$email->setSubject(sprintf('Your deployment has been approved by %s', $approver->Name));
		$email->setTemplate('DeploymentApprovedEmail');
		$email->populateTemplate($deployment);
		$email->send();

		$deployment->log()->write(sprintf(
			'Deployment approved email sent to requester %s <%s>',
			$deployer->Name,
			$deployer->Email
		));
	}

	protected function sendRejectedEmail(\DNDeployment $deployment) {
		if (!$this->canSendEmail($deployment)) {
			return false;
		}
		$deployer = $deployment->Deployer();
		$approver = $deployment->Approver();

		$email = Email::create();
		$email->setTo(sprintf('%s <%s>', $deployer->Name, $deployer->Email));
		$email->replyTo(sprintf('%s <%s>', $approver->Name, $approver->Email));
		$email->setSubject(sprintf('Your deployment has been rejected by %s', $approver->Name));
		$email->setTemplate('DeploymentRejectedEmail');
		$email->populateTemplate($deployment);
		$email->send();

		$deployment->log()->write(sprintf(
			'Deployment rejected email sent to requester %s <%s>',
			$deployer->Name,
			$deployer->Email
		));
	}

	protected function sendApprovalCancellationEmail(\DNDeployment $deployment) {
		if (!$this->canSendEmail($deployment)) {
			return false;
		}
		$deployer = $deployment->Deployer();
		$approver = $deployment->Approver();

		$to = sprintf('%s <%s>, %s <%s>', $deployer->Name, $deployer->Email, $approver->Name, $approver->Email);

		$email = Email::create();
		$email->setTo($to);
		$email->setSubject('Deployment approval has been cancelled');
		$email->setTemplate('DeploymentApprovalCancellationEmail');
		$email->populateTemplate($deployment);
		$email->send();

		$deployment->log()->write(sprintf('Deployment approval cancellation email sent to %s', $to));
	}

}
