<?php

interface EnvironmentCreateBackend {

	/**
	 * @param DNCreateEnvironment $job
	 *
	 * @return true
	 * @throws Exception
	 */
	public function createEnvironment(DNCreateEnvironment $job);

	/**
	 * Returns form fields for the create form.
	 *
	 * @return FieldList
	 */
	public function getCreateEnvironmentFields();

	/**
	 * Returns validator for the create form.
	 *
	 * @return Validator
	 */
	public function getCreateEnvironmentValidator();

}

