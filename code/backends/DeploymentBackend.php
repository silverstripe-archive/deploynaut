<?php

interface DeploymentBackend {

	/**
	 * Creates a deployment strategy that can be used to do some pre-flight checks.
	 *
	 * @param DNEnvironment $environment
	 * @param array $options An unsanitised array of request parameters from $request->requestVars.
	 *
	 * @return DeploymentStrategy
	 */
	public function planDeploy(DNEnvironment $environment, $options);

	/**
	 * Deploy the given build to the given environment.
	 *
	 * @param DNEnvironment $environment
	 * @param DeploynautLogFile $log
	 * @param DNProject $project
	 * @param array $options
	 */
	public function deploy(
		DNEnvironment $environment,
		DeploynautLogFile $log,
		DNProject $project,
		$options
	);

	/**
	 * Return a list of {@link DeployOption} for use on this environment.
	 *
	 * @param DNEnvironment $environment
	 * @return ArrayList
	 */
	public function getDeployOptions(DNEnvironment $environment);

	/**
	 * Transfer data from an environment to a local file, or from a local file
	 * back into an environment. See {@link DNDataTransfer} for details.
	 *
	 * @param DNDataTransfer $dataTransfer
	 * @param DeploynautLogFile $log
	 */
	public function dataTransfer(DNDataTransfer $dataTransfer, DeploynautLogFile $log);

	/**
	 * Put put the maintenance page
	 *
	 * @param DNEnvironment $environment
	 * @param DeploynautLogFile $log
	 * @param DNProject $project
	 */
	public function enableMaintenance(DNEnvironment $environment, DeploynautLogFile $log, DNProject $project);

	/**
	 * Disable the maintenance page
	 *
	 * @param DNEnvironment $environment
	 * @param DeploynautLogFile $log
	 * @param DNProject $project
	 */
	public function disableMaintenance(DNEnvironment $environment, DeploynautLogFile $log, DNProject $project);

	/**
	 * Checks the status of the environment
	 *
	 * @param DNEnvironment $environment
	 * @param DeploynautLogFile $log
	 * @param DNProject $project
	 */
	public function ping(DNEnvironment $environment, DeploynautLogFile $log, DNProject $project);
}
