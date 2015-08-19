<?php

interface DeploymentBackend {

	/**
	 * Deploy the given build to the given environment
	 *
	 * @param DNEnvironment $environment
	 * @param string $sha
	 * @param DeploynautLogFile $log
	 * @param DNProject $project
	 * @param bool|type $leaveMaintenancePage
	 */
	public function deploy(DNEnvironment $environment, $sha, DeploynautLogFile $log, DNProject $project, $leaveMaintenancePage = false);

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
