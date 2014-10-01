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
	 */
	public function deploy(DNEnvironment $environment, $sha, DeploynautLogFile $log, DNProject $project, $leaveMaintenancePage = false) {
		$this->extend('deployStart', $environment, $sha, $log, $project);

		$file = DEPLOYNAUT_LOG_PATH . '/' . $project->Name. ':' .$environment->Name . ".deploy-history.txt";
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

	/**
	 * Return information about the current build on the given environment.
	 * Returns a map with keys:
	 * - 'buildname' - the non-simplified name of the build deployed
	 * - 'datetime' - the datetime when the deployment occurred, in 'Y-m-d H:i:s' format
	 */
	public function currentBuild($environment) {
		$file = DEPLOYNAUT_LOG_PATH . '/' . $environment . ".deploy-history.txt";
		if(file_exists($file)) {
			$CLI_file = escapeshellarg($file);
			$lastLine = trim(`tail -n 1 $$CLI_file`);

			return $this->convertLine($lastLine);
		}
	}

	public function disableMaintenance(DNEnvironment $environment, \DeploynautLogFile $log, \DNProject $project) {
		$log->write("Maintenance page disabled on \"{$project->Name}:{$environment->Name}\"");
	}

	public function enableMaintenance(DNEnvironment $environment, \DeploynautLogFile $log, \DNProject $project) {
		$log->write("Maintenance page enabled on \"{$project->Name}:{$environment->Name}\"");
	}

	public function ping(\DNEnvironment $environment, \DeploynautLogFile $log, \DNProject $project) {
		$log->write("Ping \"{$project->Name}:{$environment->Name}\"");
	}

}
