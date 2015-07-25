<?php

/**
 * Component test for SizeRestrictedPackageCache
 * Writes to temporary locations in the filesystem
 */
class SizeRestrictedPackageCacheTest extends SapphireTest {

	protected $tempPath = null;

	protected $cache, $gen, $log;

	function setUp() {
		// We muck with the filesystem, create one folder that contains all the stuff we create,
		// and delete it entirely on tearDown()
		$this->tempPath = TEMP_FOLDER . '/PackageCacheTest-' . rand(1000000,9999999);
		mkdir($this->tempPath);

		$this->cache = new SizeRestrictedPackageCache;
		$this->cache->setCacheSize(3);
		mkdir($this->tempPath .'/cache');
		$this->cache->setBaseDir($this->tempPath .'/cache');

		$this->gen = new PackageCacheTest_MockGenerator;
		// To do: refactor so as not to be pipelinetest-specific (see also SimplePackageGeneratorTest)
		$this->log = new PipelineTest_MockLog(null);

	}
	function tearDown() {
		if($this->tempPath) Filesystem::removeFolder($this->tempPath);
	}


	function testSizeRestriction() {
		// This testing relies on the fact that MockGenerator won't use the gitDir

		// 2 in each project doesn't rupture the cache, all files will exist
		$files = array();
		$files['project1.a'] = $this->cache->getPackageFilename($this->gen, 'project1', 'a', null, $this->log);
		// This is needed so that a.tar.gz is the oldest
		sleep(1);
		$files['project1.b'] = $this->cache->getPackageFilename($this->gen, 'project1', 'b', null, $this->log);
		$files['project2.a'] = $this->cache->getPackageFilename($this->gen, 'project2', 'a', null, $this->log);
		$files['project2.b'] = $this->cache->getPackageFilename($this->gen, 'project2', 'b', null, $this->log);

		$this->assertFileExists($files['project1.a']);
		$this->assertFileExists($files['project1.b']);
		$this->assertFileExists($files['project2.a']);
		$this->assertFileExists($files['project2.b']);

		// 4 in the same project will mean the oldest is killed
		$files['project1.c'] = $this->cache->getPackageFilename($this->gen, 'project1', 'c', null, $this->log);
		$files['project1.d'] = $this->cache->getPackageFilename($this->gen, 'project1', 'd', null, $this->log);

		$this->assertFileNotExists($files['project1.a']);
		$this->assertFileExists($files['project1.b']);
	}

	/**
	 * Check that a subsequent re-fetch will mark the file as newer and so not garbage collect it
	 */
	function testSizeRestrictionIsLastAccessed() {
		// 2 in each project doesn't rupture the cache, all files will exist
		$files = array();
		$files['project1.a'] = $this->cache->getPackageFilename($this->gen, 'project1', 'a', null, $this->log);
		sleep(1);
		$files['project1.b'] = $this->cache->getPackageFilename($this->gen, 'project1', 'b', null, $this->log);
		sleep(1);
		$files['project1.c'] = $this->cache->getPackageFilename($this->gen, 'project1', 'c', null, $this->log);
		// Re-fetch a, now B will be deleted before it
		$files['project1.a'] = $this->cache->getPackageFilename($this->gen, 'project1', 'a', null, $this->log);
		$files['project1.d'] = $this->cache->getPackageFilename($this->gen, 'project1', 'd', null, $this->log);

		$this->assertFileExists($files['project1.a']);
		$this->assertFileNotExists($files['project1.b']);
	}

	/**
	 * Check that caching is actually happening
	 */
	function testCacheDoesntRegenerateUnnecessarily() {
		$this->cache->getPackageFilename($this->gen, 'project1', 'a', null, $this->log);
		$this->assertTrue($this->gen->popWasCalled());
		$this->cache->getPackageFilename($this->gen, 'project2', 'a', null, $this->log);
		$this->assertTrue($this->gen->popWasCalled());
		$this->cache->getPackageFilename($this->gen, 'project1', 'a', null, $this->log);
		$this->assertFalse($this->gen->popWasCalled());
	}

}


/**
 * Stub PackageGenerator that creates an empty file
 */
class PackageCacheTest_MockGenerator extends PackageGenerator {
	protected $wasCalled = false;

	public function getIdentifier() {
		return "";
	}

	public function generatePackage($sha, $baseDir, $outputFilename, DeploynautLogFile $log) {
		touch($outputFilename);
		$this->wasCalled = true;
		return true;
	}

	public function popWasCalled() {
		if($this->wasCalled) {
			$this->wasCalled = false;
			return true;
		}
		return false;
	}
}