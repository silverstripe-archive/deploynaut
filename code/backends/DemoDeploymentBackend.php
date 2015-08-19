<?php

/**
 * This demo back-end doesn't actually do deployment.
 *
 * Whenever you deploy, it will track the deployment history in a text file assets/<environment>.deploy-history.txt
 *
 * It's useful for demonstrating how the system works, and how you can write deployment back-ends
 */
class DemoDeploymentBackend extends Object implements DeploymentBackend {

	/**
	 * Deploy the given build to the given environment
	 *
	 * @param DNEnvironment $environment
	 * @param string $sha
	 * @param DeploynautLogFile $log
	 * @param DNProject $project
	 * @param bool $leaveMaintenancePage
	 */
	public function deploy(
		DNEnvironment $environment,
		$sha,
		DeploynautLogFile $log,
		DNProject $project,
		$leaveMaintenancePage = false
	) {
		$this->extend('deployStart', $environment, $sha, $log, $project);

		$file = sprintf('%s/%s.deploy-history.txt', DEPLOYNAUT_LOG_PATH, $environment->getFullName());
		$CLI_file = escapeshellarg($file);
		$CLI_line = escapeshellarg(date('Y-m-d H:i:s') . " => $sha");

		// Put maintenance page up
		$this->enableMaintenance($environment, $log, $project);

		// Do the deployment
		$log->write("Demo deployment: echo $CLI_line >> $CLI_file");
		`echo $CLI_line >> $CLI_file`;
		$log->write("Arbitrary pause for 10s");
		sleep(10);
		$log->write("Well, that was a waste of time");

		// Once the deployment has run it's necessary to update the maintenance page status
		if($leaveMaintenancePage) {
			$this->enableMaintenance($environment, $log, $project);
		} else {
			// Remove maintenance page if we want it to
			$this->disableMaintenance($environment, $log, $project);
		}

		$this->extend('deployEnd', $environment, $sha, $log, $project);
	}

	/**
	 * @inheritdoc
	 */
	public function dataTransfer(DNDataTransfer $dataTransfer, DeploynautLogFile $log) {
		die('Not implemented');
	}

	public function enableMaintenance(DNEnvironment $environment, \DeploynautLogFile $log, DNProject $project) {
		$log->write(sprintf('Maintenance page enabled on "%s"', $environment->getFullName()));
	}

	public function disableMaintenance(DNEnvironment $environment, DeploynautLogFile $log, DNProject $project) {
		$log->write(sprintf('Maintenance page disabled on "%s"', $environment->getFullName()));
	}

	public function ping(\DNEnvironment $environment, DeploynautLogFile $log, DNProject $project) {
		$log->write(sprintf('Ping "%s"', $environment->getFullName()));
	}

}
