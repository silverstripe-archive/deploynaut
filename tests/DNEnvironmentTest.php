<?php
/**
 *
 */
class DNEnvironmentTest extends DeploynautTest {

	/**
	 *
	 * @var DNEnvironment
	 */
	protected $env = null;

	/**
	 *
	 * @var DNProject
	 */
	protected $project = null;

	public function setUp() {
		parent::setUp();

		// Create mock objects
		$this->env = DNEnvironment::create();
		$this->env->Name = 'uat';
		$this->env->write();
		$this->project = $this->env->Project();
		$this->project->Name = 'testproject';
		$this->project->write();
	}

	/**
	 *
	 */
	public function testGetConfigFilename() {
		$expected = $this->envPath.'/testproject/uat.rb';
		$this->assertEquals($expected, $this->env->getConfigFilename());
	}
}
