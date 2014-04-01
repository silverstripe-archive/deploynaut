<?php

interface DeploymentBackend {

	/**
	 * Deploy the given build to the given environment
	 */
	public function deploy($environment, $sha, DeploynautLogFile $log, DNProject $project);

	/**
	 * Transfer data from an environment to a local file, or from a local file
	 * back into an environment. See {@link DNDataTransfer} for details.
	 *
	 * @param DNEnvironment $environment
	 * @param DNDataTransfer $dataTransfer
	 * @param DeploynautLogFile $log
	 */
	public function dataTransfer(DNDataTransfer $dataTransfer, DeploynautLogFile $log);

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
