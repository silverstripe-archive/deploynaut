<?php

/**
 * @package deploynaut
 * @subpackage control
 */
class EmailMessagingService implements ConfirmationMessagingService {

	/**
	 * @config
	 * @var string
	 */
	private static $default_from = 'deploynaut@silverstripe.com';

	/**
	 * @config
	 * @var string
	 */
	private static $default_subject = 'Confirmation required for deployment';

	public function sendMessage($source, $message, $recipients, $arguments = array()) {
		$from = empty($arguments['from'])
			? Config::inst()->get(get_class($this), 'default_from')
			: $arguments['from'];
		$subject = empty($arguments['subject'])
			? Config::inst()->get(get_class($this), 'default_subject')
			: $arguments['subject'];

		// Split users and send individually
		$this->sendIndividualMessages($source, $message, $recipients, $from, $subject);
	}

	/**
	 * Separates recipients into individual users
	 *
	 * @param PipelineStep $source Source client step
	 * @param string $message Plain text message
	 * @param mixed $recipients Either a Member object, string, or array of strings or Member objects
	 * @param string $from
	 * @param string $subject
	 * @return boolean True if success
	 */
	protected function sendIndividualMessages($source, $message, $recipients, $from, $subject) {
		// Split recipients that are comma separated
		if(is_string($recipients) && stripos($recipients, ',')) {
			$recipients = explode(',', $recipients);
			return $this->sendIndividualMessages($source, $message, $recipients, $from, $subject);
		}

		// Iterate through arrays
		if(is_array($recipients) || $recipients instanceof SS_List) {
			foreach($recipients as $recipient) {
				$this->sendIndividualMessages($source, $message, $recipient, $from, $subject);
			}
			return true;
		}

		if($recipients) {
			$this->sendMessageTo($source, $from, $recipients, $subject, $message);
			return true;
		}

		// Can't send to empty recipient
		return false;
	}


	/**
	 * Send an message to a single recipient
	 *
	 * @param PipelineStep $source Client step
	 * @param string $from
	 * @param string|Member $to
	 * @param string $subject
	 * @param string $body
	 */
	protected function sendMessageTo($source, $from, $to, $subject, $body) {
		if($to instanceof Member) $to = $to->Email;
		$this->sendViaEmail($source, $from, $to, $subject, $body);
	}

	/**
	 * Send an email to a single recipient
	 *
	 * @param PipelineStep $source Client step
	 * @param string $from
	 * @param string|Member $to
	 * @param string $subject
	 * @param string $body
	 */
	protected function sendViaEmail($source, $from, $to, $subject, $body) {
		$email = new Email($from, $to, $subject, $body);
		$email->sendPlain();
		$source->log("Sent message to $to (subject: $subject)");
	}

}
