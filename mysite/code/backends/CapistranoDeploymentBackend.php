<?php

class CapistranoDeploymentBackend implements DeploymentBackend {
	
	/**
	 * Return information about the current build on the given environment.
	 * Returns a map with keys:
	 * - 'buildname' - the non-simplified name of the build deployed
	 * - 'datetime' - the datetime when the deployment occurred, in 'Y-m-d H:i:s' format
	 */
	public function currentBuild($environment) {
		$file = ASSETS_PATH . '/' . $environment . ".deploy-history.txt";
		
		if(file_exists($file)) {
			$lines = file($file);
			$lastLine = array_pop($lines);
			return $this->convertLine($lastLine);
		}
	}

	/**
	 * Deploy the given build to the given environment.
	 */
	public function deploy($environment, $buildname, $buildFile, DNProject $project) {
		$deployLog = ASSETS_PATH . '/'."deploy-log.txt";
		chdir(dirname(getcwd()));
		$deploymentCommand = "cap $environment deploy -s build=$buildname";
		echo $deploymentCommand;
		$command = "nohup $deploymentCommand > '$deployLog' 2> '$deployLog' < /dev/null &";
		system($command);
	}

	/**
	 * Return a complete deployment history, as an array of maps.
	 * Each map matches the format returned by {@link getCurrentBuild()}, and are returned oldest first
	 */
	public function deployHistory($environment) {
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
