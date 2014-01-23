<?php

interface DeploymentBackend {

	/**
	 * Deploy the given build to the given environment
	 */
	public function deploy($environment, $sha, DeploynautLogFile $log, DNProject $project);

	/**
	 * Return information about the current build on the given environment.
	 * Returns a map with keys:
	 * - 'buildname' - the non-simplified name of the build deployed
	 * - 'datetime' - the datetime when the deployment occurred, in 'Y-m-d H:i:s' format
	 *
	 * @param string $environment env name, including project name.
	 */
	public function currentBuild($environment);

}
