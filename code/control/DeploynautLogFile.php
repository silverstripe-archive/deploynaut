<?php

/**
 * Simple support class for reading and writing deploynaut job logs
 */
class DeploynautLogFile {
	protected $logFile;

	function __construct($logFile) {
		$this->logFile = DEPLOYNAUT_LOG_PATH . '/' . $logFile;
	}

	function write($message) {
		error_log('['.date('Y-m-d H:m:s').'] ' . $message .PHP_EOL, 3, $this->logFile);
	}

	function exists() {
		return file_exists($this->logFile);
	}

	function content() {
		return file_get_contents($this->logFile);
	}

}