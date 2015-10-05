<?php
class DeploynautLogFileTest extends SapphireTest {

	protected $basePath;

	public function setUp() {
		parent::setUp();

		$this->basePath = '/tmp/deploynautlogstest';
		mkdir($this->basePath);
	}

	public function testLogFileNameSanitised() {
		$log = new DeploynautLogFile('SomeSortOf Filename (UAT).log', $this->basePath);
		$this->assertEquals($log->getSanitisedLogFilePath(), $this->basePath . '/somesortof-filename-uat.log');

		$log = new DeploynautLogFile('..SomeSortOf Filename_(UAT).log', $this->basePath);
		$this->assertEquals($log->getSanitisedLogFilePath(), $this->basePath . '/somesortof-filename-uat.log');

		$log = new DeploynautLogFile('test-project.1823.log', $this->basePath);
		$this->assertEquals($log->getSanitisedLogFilePath(), $this->basePath . '/test-project.1823.log');
	}

	public function testUnsanitisedLogFileFallback() {
		touch($this->basePath . '/' . 'SomeSortOf Filename (UAT).log');

		$log = new DeploynautLogFile('SomeSortOf Filename (UAT).log', $this->basePath);
		$this->assertEquals($log->getLogFilePath(), $this->basePath . '/SomeSortOf Filename (UAT).log');
		$this->assertTrue($log->exists());

		// writing into the logs still works, and we reference the old file path still.
		$log->write('Some test content');
		$this->assertEquals($log->getLogFilePath(), $this->basePath . '/SomeSortOf Filename (UAT).log');
		$this->assertContains('Some test content', $log->content());
	}

	public function testLogWriting() {
		$log = new DeploynautLogFile('SomeSortOf Filename (UAT).log', $this->basePath);
		$this->assertFalse($log->exists());
		$this->assertNull($log->getLogFilePath());

		$log->write('This is some content');
		$this->assertTrue($log->exists());
		$this->assertEquals($this->basePath . '/somesortof-filename-uat.log', $log->getLogFilePath());
		$this->assertContains('This is some content', $log->content());
	}

	public function testLogDoesntExistMessage() {
		$log = new DeploynautLogFile('SomeSortOf Filename (UAT).log', $this->basePath);
		$this->assertNull($log->getLogFilePath());
		$this->assertEquals('Log has not been created yet.', $log->content());
	}

	public function tearDown() {
		parent::tearDown();

		exec(sprintf('rm -rf %s', $this->basePath));
	}

}
