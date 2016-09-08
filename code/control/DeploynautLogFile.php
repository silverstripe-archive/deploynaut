<?php

/**
 * Simple support class for reading and writing deploynaut job logs
 */
class DeploynautLogFile {

	protected $logFile;

	protected $basePath;

	/**
	 * @param string $logFile The log filename
	 * @param string|null $basePath Base path of where logs reside. Defaults to DEPLOYNAUT_LOG_PATH
	 */
	public function __construct($logFile, $basePath = null) {
		$this->logFile = $logFile;
		if ($basePath !== null) {
			$this->basePath = $basePath;
		} else if (defined('DEPLOYNAUT_LOG_PATH')) {
			$this->basePath = DEPLOYNAUT_LOG_PATH;
		} else {
			$this->basePath = sys_get_temp_dir();
		}
	}

	/**
	 * Set the log filename
	 * @param string $filename
	 */
	public function setLogFile($filename) {
		$this->logFile = $filename;
	}

	/**
	 * Set the base path of where logs reside
	 * @param string $path
	 */
	public function setBasePath($path) {
		$this->basePath = $path;
	}

	/**
	 * Return the un-sanitised log path.
	 * @return string
	 */
	public function getRawFilePath() {
		return $this->basePath . '/' . $this->logFile;
	}

	/**
	 * Get the sanitised log path.
	 * @return string
	 */
	public function getSanitisedLogFilePath() {
		return $this->basePath . '/' . strtolower(FileNameFilter::create()->filter($this->logFile));
	}

	/**
	 * Return log file path, assuming it exists. Returns NULL if nothing found.
	 * @return string|null
	 */
	public function getLogFilePath() {
		$path = $this->getSanitisedLogFilePath();

		// for backwards compatibility on old logs
		if (!file_exists($path)) {
			$path = $this->getRawFilePath();

			if (!file_exists($path)) {
				return null;
			}
		}

		return $path;
	}

	/**
	 * Write a message line into the log file.
	 * @param string $message
	 */
	public function write($message) {
		// Make sure we write into the old path for existing logs. New logs use the sanitised file path instead.
		$path = file_exists($this->getRawFilePath()) ? $this->getRawFilePath() : $this->getSanitisedLogFilePath();

		error_log('[' . date('Y-m-d H:i:s') . '] ' . $message . PHP_EOL, 3, $path);
		@chmod($path, 0666);
	}

	/**
	 * Does the log file exist?
	 * @return bool
	 */
	public function exists() {
		return (bool) $this->getLogFilePath();
	}

	/**
	 * Return the content of the log file.
	 * @return string
	 */
	public function content() {
		return $this->exists() ? file_get_contents($this->getLogFilePath()) : 'Log has not been created yet.';
	}

}
