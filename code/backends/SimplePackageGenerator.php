<?php

/**
 * Generates the package directly on the deploynaut server
 */
class SimplePackageGenerator extends PackageGenerator {

	protected $buildScript = "composer install --prefer-dist --no-dev";

	public function getParamMetadata() {
		return array(
			'BuildScript' => array('title' => 'Build script'),
		);
	}

	public function getBuildScript() {
		return $this->buildScript;
	}

	public function setBuildScript($buildScript) {
		$this->buildScript = $buildScript;
	}

	public function getIdentifier() {
		// If the build script changes, don't re-use cached items
		return substr(sha1($this->buildScript), 0, 8);
	}

	/**
	 * Generate the package
	 */
	public function generatePackage($sha, $baseDir, $outputFilename, DeploynautLogFile $log) {
		$tempPath = TEMP_FOLDER . "/" . str_replace(".tar.gz", "", basename($outputFilename));
		if(!file_exists($tempPath)) {
			mkdir($tempPath);
		}

		$escapedTempPath = escapeshellarg($tempPath);
		$escapedOutputFile = escapeshellarg($outputFilename);
		$escapedTempDir = escapeshellarg(basename($tempPath));

		// Execute these in sequence until there's a failure
		$processes = array(
			// Export the relevant SHA into a temp folder
			new AbortableProcess("git archive $sha | tar -x -C " . $escapedTempPath, $baseDir),
			// Run build script
			new AbortableProcess($this->buildScript, $tempPath, null, null, 3600),
			// Compress the result
			new AbortableProcess("tar -czf " . $escapedOutputFile . " " . $escapedTempDir, dirname($tempPath)),
		);

		// Call at the end, regardless of success or failure
		$cleanup = array(
			// Delete the temporary staging folder
			new AbortableProcess("rm -rf " . $escapedTempPath),
		);

		try {
			$this->executeProcesses($processes, $log);
		} catch(Exception $e) {
			// Execute cleanup on failure
			$this->executeProcesses($cleanup, $log);
			throw $e;
		}

		// Execute cleanup on success
		$this->executeProcesses($cleanup, $log);
		return true;
	}

	/**
	 * Execute an array of processes, one after the other, throwing an exception on the first failure.
	 *
	 * @param array $processes An array of Symfony\Component\Process\Process objects
	 * @param DeploynautLogFile $log The log to send output to
	 */
	protected function executeProcesses($processes, DeploynautLogFile $log) {
		foreach($processes as $process) {
			$process->mustRun(function($type, $buffer) use($log) {
				$log->write($buffer);
			});
		}
	}
}
