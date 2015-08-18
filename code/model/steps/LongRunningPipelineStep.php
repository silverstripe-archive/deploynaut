<?php

/**
 * Represents a long running pipeline step with a timeout
 *
 * @package deploynaut
 * @subpackage pipeline
 */
class LongRunningPipelineStep extends PipelineStep {

	/**
	 * Determines maximum allowed execution for deployment
	 *
	 * @return int Number of seconds, or null if not enabled
	 */
	public function getMaxDuration() {
		return $this->getConfigSetting('MaxDuration') ?: null;
	}

	private static $db = array(
		'Started' => 'SS_Datetime'
	);

	/**
	 * Return true if this has timed out
	 *
	 * @return boolean
	 */
	public function isTimedOut() {
		$age = $this->getAge();
		$timeout = $this->getMaxDuration();
		return $age && $timeout && ($age > $timeout);
	}

	/**
	 * Gets the age of this job in seconds, or 0 if not started
	 *
	 * @return int Age in seconds
	 */
	public function getAge() {
		if($this->Started) {
			$started = intval($this->dbObject('Started')->Format('U'));
			$now = intval(SS_Datetime::now()->Format('U'));
			if($started && $now) {
				return $now - $started;
			}
		}
		return 0;
	}

	public function start() {
		// Ensure started date is set
		if(!$this->Started) {
			$this->Started = SS_Datetime::now()->Rfc2822();
			$this->write();
		}
	}
}
