<?php

/*
 * @package deploynaut
 * @subpackage control
 */
interface ConfirmationMessagingService {
	
	/**
	 * Sends a message to the specified user
	 * 
	 * @param PipelineData $source Source client step
	 * @param string $message Plain text message
	 * @param mixed $recipients Either a Member object, string, or array of strings or Member objects
	 * @param array $arguments Additional arguments that may be configured
	 * @return boolean True if success
	 */
	public function sendMessage($source, $message, $recipients, $arguments = array());
}
