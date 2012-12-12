<?php

/**
 * Description of SSResqueHealthCheck
 *
 */
class SSResqueHealthCheck {
	
	protected static $last_error_string = '';
	
	public static function workers_count() {
		return count(Resque_Worker::all());
	}
	
	public static function redis_unavailable() {
		set_error_handler(array('SSResqueHealthCheck','error'));
		try {
			Resque::queues();
		} catch(Exception $e) {
			return $e->getMessage();
		}
		restore_error_handler();
		return false;
	}
	
	public static function error($errno, $errstr, $errfile, $errline, $errcontext) {
		self::$last_error_string = $errstr;
	}
}
