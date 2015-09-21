<?php

interface EnvironmentCreateBackend {

	/**
	 * @param DNCreateEnvironment $environment
	 */
	public function createEnvironment(DNCreateEnvironment $environment);

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

