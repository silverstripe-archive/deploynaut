<?php

abstract class DeploynautTest extends SapphireTest {

	/**
	 * @var string
	 */
	protected $envPath = '';

	/**
	 * Setup the environment to point to a temporary location
	 *
	 * @param string $path
	 */
	protected function setTemporaryPath($path) {
		$this->envPath = $path;
		Filesystem::makeFolder($this->envPath);
		$this->envPath = realpath($this->envPath);
		Injector::inst()->load(array(
			'DNData' => array(
				'properties' => array(
					'EnvironmentDir' => $this->envPath,
					'KeyDir' => TEMP_FOLDER .'/deploynaut_test/gitkeys',
					'DataTransferDir' => Director::baseFolder() . '/assets/transfers',
					'GitUser' => ''
				)
			)
		));
	}

	public function setUp() {
		parent::setUp();
		SS_Datetime::clear_mock_now();
		Injector::nest();
		Injector::inst()->load(array(
			'DNProject' => 'DeploynautTest_Project',
		));

		// Set temp location
		$this->setTemporaryPath(TEMP_FOLDER . '/deploynaut_test/envs');
	}

	public function tearDown() {
		Injector::unnest();
		SS_Datetime::clear_mock_now();

		if($this->envPath) {
			Filesystem::removeFolder($this->envPath);
			$this->envPath = null;
		}

		parent::tearDown();
	}
}

class DeploynautTest_Project extends DNProject implements TestOnly {

	protected function checkCVSPath() {
		// Don't initialise resque task to query git during tests
	}
}

class DeploynautTest_MockLog extends DeploynautLogFile implements TestOnly {

	protected static $messages = array();

	public function __construct($logFile) {
	}

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
