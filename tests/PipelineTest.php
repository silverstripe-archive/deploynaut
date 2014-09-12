<?php

abstract class PipelineTest extends DeploynautTest {

	public function setUp() {
		parent::setUp();
		Injector::inst()->load(array(
			'DeploynautLogFile' => 'PipelineTest_MockLog',
			'ConfirmationMessagingService' => 'PipelineTest_RecordingMessageSender'
		));
		$this->clearLog();
	}

	/**
	 * Gets the config data from the test pipeline config file
	 *
	 * @return array
	 * @throws Exception
	 */
	protected function getPipelineConfig() {
		require_once 'thirdparty/spyc/spyc.php';
		$path = __DIR__ . '/PipelineTest_Config.yml';
		if(!file_exists($path)) {
			throw new Exception(sprintf('YAML configuration for pipeline not found at path "%s"', $path));
		}
		return Spyc::YAMLLoad($path);
	}

	/**
	 * Reset logs of scaffolded services
	 */
	protected function clearLog() {
		PipelineTest_MockLog::clear();
		PipelineTest_RecordingMessageSender::clear();
	}

	protected function assertHasLog($message) {
		$this->assertTrue(PipelineTest_MockLog::has_message($message), "Assert log \"$message\"");
	}

	protected function assertNotLogged($message) {
		$this->assertFalse(PipelineTest_MockLog::has_message($message), "Assert not logged \"$message\"");
	}

	public function assertSentMessage($message, $recipient) {
		$this->assertTrue(
			PipelineTest_RecordingMessageSender::has_message($message, $recipient),
			"Assert message \"$message\" sent to \"$recipient\""
		);
	}

	public function assertNotSentMessage($message, $recipient) {
		$this->assertFalse(
			PipelineTest_RecordingMessageSender::has_message($message, $recipient),
			"Assert message \"$message\" not sent to \"$recipient\""
		);
	}
}


/**
 * Dummy logging service
 */
class PipelineTest_MockLog extends DeploynautLogFile implements TestOnly {

	protected static $messages = array();

	public function __construct($logFile) {}

	public static function clear() {
		self::$messages = array();
	}

	public static function get_messages() {
		return self::$messages;
	}

	public function write($message) {
		self::log($message);
	}

	public static function log($message) {
		self::$messages[] = $message;
	}


	public function exists() {
		return true;
	}

	public function content() {
		return implode(PHP_EOL, self::$messages);
	}

	/**
	 * Check if any message contains the given string
	 *
	 * @param string $test
	 * @return boolean True if this message is contained in any of the given messages
	 */
	public static function has_message($test) {
		foreach(self::$messages as $message) {
			if(strpos($message, $test) !== false) return true;
		}
		return false;
	}
}

class PipelineTest_RecordingMessageSender extends EmailMessagingService implements TestOnly {

	protected static $messages = array();

	public static function clear() {
		self::$messages = array();
	}

	public static function get_messages() {
		return self::$messages;
	}

	public static function has_message($test, $recipient = null) {
		foreach(self::$messages as $message) {
			if($message[1] !== $test) continue;
			if($recipient && $message[0] === $recipient) return true;
		}
		return false;
	}

	protected function sendViaEmail($source, $from, $to, $subject, $body) {
		self::$messages[] = array($to, $body);
		$source->log("Sent message to $to (subject: $subject)");
		return true;
	}

}
