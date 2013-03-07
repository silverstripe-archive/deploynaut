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
	function deploy($environment, $buildname, $buildFile, $logFile, DNProject $project) {
		GraphiteDeploymentNotifier::notify_start($environment, $buildname, $buildFile, $project);

		$file = ASSETS_PATH . '/' . $logFile;
		$CLI_file = escapeshellarg($file);
		$CLI_line = escapeshellarg(date('Y-m-d H:i:s') . " => $buildname");
		
		echo "Demo deployment: echo $CLI_line >> $CLI_file\n";
		flush();		
		
		`echo $CLI_line >> $CLI_file`;

		GraphiteDeploymentNotifier::notify_end($environment, $buildname, $buildFile, $project);
	}

	/**
	 * Return information about the current build on the given environment.
	 * Returns a map with keys:
	 * - 'buildname' - the non-simplified name of the build deployed
	 * - 'datetime' - the datetime when the deployment occurred, in 'Y-m-d H:i:s' format
	 */
	function currentBuild($environment) {
		$file = ASSETS_PATH . '/' . $environment . ".deploy-history.txt";
		if(file_exists($file)) {
			$CLI_file = escapeshellarg($file);
			$lastLine = trim(`tail -n 1 $$CLI_file`);
		
			return $this->convertLine($lastLine);
		}
	}
		
	/**
	 * Return a complete deployment history, as an array of maps.
	 * Each map matches the format returned by {@link getCurrentBuild()}, and are returned newest first
	 */
	function deployHistory($environment) {
		$file = ASSETS_PATH . '/' . $environment . ".deploy-history.txt";
		$CLI_file = escapeshellarg($file);
		
		$history = array();
		if(file_exists($file)) {
			$lines = explode("\n", file_get_contents($file));
			foreach($lines as $line) {
				if($converted = $this->convertLine($line)) {
					$history[] = $converted;
				}
			}
		}
		return array_reverse($history);
	}

	protected function convertLine($line) {
		if(!trim($line)) return null;
		if(!strpos($line, "=>")) return null;
		
		list($datetime, $buildname) = explode("=>", $line, 2);
		return array(
			'buildname' => trim($buildname),
			'datetime' => trim($datetime),
		);
	}

}

