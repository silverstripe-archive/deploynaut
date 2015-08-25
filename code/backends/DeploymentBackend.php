<?php

interface DeploymentBackend {

	/**
	 * Creates a deployment strategy that can be used to do some pre-flight checks.
	 *
	 * @param DNEnvironment $environment
	 * @param string $sha
	 * @param array $options
	 *
	 * @return DeploymentStrategy
	 */
	public function planDeploy(DNEnvironment $environment, $sha, $options = array());

	/**
	 * Deploy the given build to the given environment.
	 *
	 * @param DNEnvironment $environment
	 * @param string $sha
	 * @param DeploynautLogFile $log
	 * @param DNProject $project
	 * @param bool|type $leaveMaintenancePage
	 * @param array $options
	 */
	public function deploy(
		DNEnvironment $environment,
		$sha,
		DeploynautLogFile $log,
		DNProject $project,
		$leaveMaintenancePage = false,
		$options = array()
	);

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
