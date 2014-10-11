<?php

/**
 * Component test for SimplePackageGenerator
 * Writes to temporary locations in the filesystem
 */
class SimplePackageGeneratorTest extends SapphireTest {

	protected $tempPath = null;

	function setUp() {
		// We muck with the filesystem, create one folder that contains all the stuff we create,
		// and delete it entirely on tearDown()
		$this->tempPath = TEMP_FOLDER . '/SimplePackageGeneratorTest-' . rand(1000000,9999999);
		mkdir($this->tempPath);
		
	}
	function tearDown() {
		if($this->tempPath) Filesystem::removeFolder($this->tempPath);
	}

	/**
	 * Test that generatePackage produces a .tar.gz containing the git repo.
	 * Test that the build script is executed.
	 */
	function testGeneratePackage() {
		// Build some precursor state for the test
		$gitPath = $this->tempPath .'/git-repo';
		$packagePath = $this->tempPath .'/test.tar.gz';
		$sha = $this->createTempGitRepo($gitPath);
		$this->assertNotEmpty($sha);

		// TO DO: DeploynautLogFile should be replaced with a generic interface (maybe PSR-3)
		// and a generic memory-log or mock-log placed in here.
		$log = new PipelineTest_MockLog(null);

		// Create the generator and execute the script		
		$gen = new SimplePackageGenerator;
		$gen->setBuildScript("touch build-script-executed.txt");
		$this->assertTrue($gen->generatePackage($sha, $gitPath, $packagePath, $log));

		// Fetch the sorted contents of the package files
		$CLI_packagePath = escapeshellarg($packagePath);
		$packageFiles = explode("\n", trim(`tar tzf $CLI_packagePath`));
		sort($packageFiles);

		// Confirm the git repo was used as the basis of the package
		// Confirm that the build script was executed
		// Confirm not junk files included
		$this->assertEquals(array(
			'test/',
			'test/README.md', 
			'test/build-script-executed.txt',
			'test/index.php',
		), $packageFiles);
	}

	/**
	 * Create a simple temporary git repo at the given path, for component testing,
	 * and return the SHA of the EHAD
	 */
	protected function createTempGitRepo($path) {
		$CLI_path = escapeshellarg($path);
		mkdir($path);
		`cd $CLI_path && git init`;
		file_put_contents("$path/README.md", "This is a test repo");
		file_put_contents("$path/index.php", "<?php\necho 'test';");
		`cd $CLI_path && git add README.md index.php && git commit -m 'first commit'`;
		return trim(`cd $CLI_path && git show | grep ^commit | awk ' { print \$2 } '`);
	}
}