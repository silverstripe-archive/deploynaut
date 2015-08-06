<?php

/**
 * Simple support class for reading and writing deploynaut job logs
 */
class DeploynautLogFile {

	protected $logFile;

	public function __construct($logFile) {
		$this->logFile = DEPLOYNAUT_LOG_PATH . '/' . $logFile;
	}

	public function getLogFile() {
		return $this->logFile;
	}

	/**
	 * Write a message line into the log file.
	 * @param string $message
	 */
	public function write($message) {
		error_log('['.date('Y-m-d H:i:s').'] ' . $message .PHP_EOL, 3, $this->logFile);
		@chmod($this->logFile, 0666);
	}

	/**
	 * Does the log file exist?
	 * @return bool
	 */
	public function exists() {
		return file_exists($this->logFile);
	}

	/**
	 * Return the content of the log file.
	 * @return string
	 */
	public function content() {
		return $this->exists() ? file_get_contents($this->logFile) : 'Log has not been created yet.';
	}

}
