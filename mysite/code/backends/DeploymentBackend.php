<?php

interface DeploymentBackend {

	/**
	 * Deploy the given build to the given environment
	 */
	function deploy($environment, $buildname, $buildFile, $logFile);

	/**
	 * Return information about the current build on the given environment.
	 * Returns a map with keys:
	 * - 'buildname' - the non-simplified name of the build deployed
	 * - 'datetime' - the datetime when the deployment occurred, in 'Y-m-d H:i:s' format
	 *
	 * @param string $environment env name, including project name.
	 */
	public function currentBuild($environment);

	/**
	 * Return a complete deployment history, as an array of maps.
	 * Each map matches the format returned by {@link getCurrentBuild()}, and are returned oldest first
	 *
	 * @param string $environment env name, including project name.
	 */
	function deployHistory($environment);

}
