<?php

interface EnvironmentCreateBackend {

	/**
	 * @param \DNCreateEnvironment $job
	 *
	 * @return true
	 * @throws Exception
	 */
	public function createEnvironment(\DNCreateEnvironment $job);

	/**
	 * Returns form fields for the create form.
	 *
	 * @param \DNProject $project
	 * @return FieldList
	 */
	public function getCreateEnvironmentFields(\DNProject $project);

	/**
	 * Returns validator for the create form.
	 *
	 * @return Validator
	 */
	public function getCreateEnvironmentValidator();

}

