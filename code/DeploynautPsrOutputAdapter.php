<?php

/**
 * Adapt DeploynautLogFile logger to work as a PSR logger.
 */
class DeploynautPsrOutputAdapter extends \Psr\Log\AbstractLogger {

	/**
	 * @var DeploynautLogFile
	 */
	protected $log;

	public function __construct(DeploynautLogFile $log) {
		$this->log = $log;
	}

	public function log($level, $message, array $context = []) {
		$this->log->write($message);
	}
}

