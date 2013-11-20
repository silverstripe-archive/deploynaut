<?php

/**
 * Simple support class for reading and writing deploynaut job logs
 */
class DeploynautLogFile {
	protected $logFile;

	public function __construct($logFile) {
		$this->logFile = DEPLOYNAUT_LOG_PATH . '/' . $logFile;
	}

	public function write($message) {
		error_log('['.date('Y-m-d H:i:s').'] ' . $message .PHP_EOL, 3, $this->logFile);
		@chmod($this->logFile, 0666);
	}

	public function exists() {
		return file_exists($this->logFile);
	}

	public function content() {
		return file_get_contents($this->logFile);
	}

}
