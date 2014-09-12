<?php

abstract class DeploynautTest extends SapphireTest {

	/**
	 *
	 * @var type
	 */
	protected $envPath = '';

	/**
	 * Setup the environment to point to a temporary location
	 *
	 * @param type $path
	 */
	protected function setTemporaryPath($path) {
		$this->envPath = $path;
		Filesystem::makeFolder($this->envPath);
		Injector::inst()->load(array(
			'DNData' => array(
				'constructor' => array(
					0 => $this->envPath,
					1 => TEMP_FOLDER .'/deploynaut_test/gitkeys',
					2 => Director::baseFolder() . '/assets/transfers'
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
			'DeploymentBackend' => 'DemoDeploymentBackend'
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