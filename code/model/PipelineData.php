<?php

interface PipelineData {

	/**
	 * Is this a dry run?
	 *
	 * @return bool
	 */
	public function getDryRun();

	/**
	 * Log message
	 *
	 * @param string $message The message to log
	 */
	public function log($message);
}
