<?php

/**
 * This demo back-end doesn't actually do deployment.
 *
 * Whenever you deploy, it will track the deployment history in a text file assets/<environment>.deploy-history.txt
 *
 * It's useful for demonstrating how the system works, and how you can write deployment back-ends
 */
class DemoDeploymentBackend implements DeploymentBackend {
	/**
	 * Deploy the given build to the given environment
	 */
	public function deploy($environment, $sha, $log, DNProject $project) {
		GraphiteDeploymentNotifier::notify_start($environment, $sha, null, $project);

		$file = DEPLOYNAUT_LOG_PATH . '/' . $project->Name. ':' .$environment . ".deploy-history.txt";
		$CLI_file = escapeshellarg($file);
		$CLI_line = escapeshellarg(date('Y-m-d H:i:s') . " => $sha");

		$log->write("Demo deployment: echo $CLI_line >> $CLI_file");
		`echo $CLI_line >> $CLI_file`;
		$log->write("Arbitrary pause for 10s");
		sleep(10);
		$log->write("Well, that was a waste of time");

		GraphiteDeploymentNotifier::notify_end($environment, $sha, null, $project);
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
}
