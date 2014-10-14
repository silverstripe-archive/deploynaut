<?php

abstract class PipelineTest extends DeploynautTest {

	public function setUp() {
		parent::setUp();
		Injector::inst()->load(array(
			'DeploynautLogFile' => 'PipelineTest_MockLog',
			'ConfirmationMessagingService' => 'PipelineTest_RecordingMessageSender',
			'DNDeployment' => 'PipelineTest_DNDeployment',
			'DNDataTransfer' => 'PipelineTest_DNDataTransfer'
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


/**
 * Dummy deployment service
 */
class PipelineTest_DNDeployment extends DNDeployment implements TestOnly {

	public function __construct($record = null, $isSingleton = false, $model = null) {
		// Set the fields data.
		if(!$record) {
			$record = array(
				'ID' => 0,
				'ClassName' => 'DNDeployment',
				'RecordClassName' => 'DNDeployment'
			);
		}

		parent::__construct($record, $isSingleton, $model);

		$this->class = 'DNDeployment';
	}

	protected function enqueueDeployment() {
		// Mock behaviour of enqueue without actually enqueuing anything
		$environment = $this->Environment();
		$project = $environment->Project();

		$log = $this->log();
		$log->write('Deploying "'.$this->SHA.'" to "'.$project->Name.':'.$environment->Name.'"');

		if(!$this->DeployerID) $this->DeployerID = Member::currentUserID();
		if($this->DeployerID) {
			$deployer = $this->Deployer();
			$message = sprintf(
				'Deploy to %s:%s initiated by %s (%s)',
				$project->Name,
				$environment->Name,
				$deployer->getName(),
				$deployer->Email
			);
			$log->write($message);
		}

		return 'dummytoken';
	}

	public function getSHA() {
		$sha = parent::getField('SHA');
		return $sha ?: '9ae502821345ab39b04d46ce6bb822ccdd7f7414';
	}

	public function start() {
		$this->Status = 'Queued';
		$this->write();
	}

	public function markFinished() {
		$this->Status = 'Finished';
		$this->write();
	}

	public function markFailed() {
		$this->Status = 'Failed';
		$this->write();
	}

	public function ResqueStatus() {
		// Just lie, remembering to map 'Finished' to 'Complete'
		return $this->Status === 'Finished' ? 'Complete' : $this->Status;
	}
}

class PipelineTest_DNDataTransfer extends DNDataTransfer implements TestOnly {

	public function __construct($record = null, $isSingleton = false, $model = null) {
		// Set the fields data.
		if(!$record) {
			$record = array(
				'ID' => 0,
				'ClassName' => 'DNDataTransfer',
				'RecordClassName' => 'DNDataTransfer'
			);
		}

		parent::__construct($record, $isSingleton, $model);

		$this->class = 'DNDataTransfer';
	}

	public function start() {
		$this->Status = 'Queued';
	}

	public function markFinished() {
		$this->Status = 'Finished';
		$this->write();
	}

	public function markFailed() {
		$this->Status = 'Failed';
		$this->write();
	}

	public function ResqueStatus() {
		// Just lie, remembering to map 'Finished' to 'Complete'
		return $this->Status === 'Finished' ? 'Complete' : $this->Status;
	}
}

class PipelineTest_Environment extends DNEnvironment implements TestOnly {

	/**
	 * Use the demo backend
	 *
	 * @var string
	 */
	protected $deploymentBackend = "DemoDeploymentBackend";

}