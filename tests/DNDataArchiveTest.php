<?php
class DNDataArchiveTest extends SapphireTest {

	protected static $fixture_file = 'DNDataArchiveTest.yml';

	public function setUp() {
		$this->envPath = '/tmp/deploynaut_test/envs';
		Config::inst()->update('Injector', 'DNData', array(
			'constructor' => array(
				0 => $this->envPath,
				1 => '/tmp/deploynaut_test/gitkeys',
				1 => '/tmp/deploynaut_test/datatransfer',
			)
		));

		parent::setUp();
	}

	/**
	 * We check a number of different conditionals here (see DNDataArchiveTest.yml for relationships):
	 * - Samantha can upload to & download from project1:uat, but not project1:live
	 * - Sarah can upload to but not download from project1:uat, and can't do anything with project1:live
	 * - Neither Samantha nor Sarah can do anything with project2:uat or project2:live
	 */
	public function testArchivePermissions() {
		$project1 = $this->objFromFixture('DNProject', 'project1');
		$project2 = $this->objFromFixture('DNProject', 'project2');

		$samantha = $this->objFromFixture('Member', 'project1-samantha');
		$sarah = $this->objFromFixture('Member', 'project1-sarah');

		// Samantha can upload to & download from project1:uat, but not project1:live
		$this->assertTrue($project1->Environments()->filter('Name', 'uat')->First()->canUploadArchive($samantha));
		$this->assertTrue($project1->Environments()->filter('Name', 'uat')->First()->canDownloadArchive($samantha));
		$this->assertFalse($project1->Environments()->filter('Name', 'live')->First()->canUploadArchive($samantha));
		$this->assertFalse($project1->Environments()->filter('Name', 'live')->First()->canDownloadArchive($samantha));

		// Sarah can upload to but not download from project1:uat, and can't do anything with project1:live
		$this->assertTrue($project1->Environments()->filter('Name', 'uat')->First()->canUploadArchive($sarah));
		$this->assertFalse($project1->Environments()->filter('Name', 'uat')->First()->canDownloadArchive($sarah));
		$this->assertFalse($project1->Environments()->filter('Name', 'live')->First()->canUploadArchive($sarah));
		$this->assertFalse($project1->Environments()->filter('Name', 'live')->First()->canDownloadArchive($sarah));

		// Neither Samantha nor Sarah can do anything with project2:uat or project2:live
		$this->assertFalse($project2->Environments()->filter('Name', 'uat')->First()->canUploadArchive($samantha));
		$this->assertFalse($project2->Environments()->filter('Name', 'uat')->First()->canDownloadArchive($samantha));
		$this->assertFalse($project2->Environments()->filter('Name', 'live')->First()->canUploadArchive($samantha));
		$this->assertFalse($project2->Environments()->filter('Name', 'live')->First()->canDownloadArchive($samantha));

		$this->assertFalse($project2->Environments()->filter('Name', 'uat')->First()->canUploadArchive($sarah));
		$this->assertFalse($project2->Environments()->filter('Name', 'uat')->First()->canDownloadArchive($sarah));
		$this->assertFalse($project2->Environments()->filter('Name', 'live')->First()->canUploadArchive($sarah));
		$this->assertFalse($project2->Environments()->filter('Name', 'live')->First()->canDownloadArchive($sarah));
	}

	public function testGenerateFilePath() {
		// SS_Datetime::mock_now('2010-01-01 23:23:23');
		$project1 = $this->objFromFixture('DNProject', 'project1');
		$project1uatEnv = $this->objFromFixture('DNEnvironment', 'project1-uat');

		$dataTransfer = new DNDataTransfer();
		$dataTransfer->Direction = 'get';
		$dataTransfer->Mode = 'all';
		$dataTransfer->write();

		$archive = new DNDataArchive();
		$archive->EnvironmentID = $project1uatEnv->ID;
		$archive->write();

		$filepath1 = $archive->generateFilepath($dataTransfer);
		$this->assertNotNull($filepath1);
		$this->assertContains('project_1', $filepath1);
		$this->assertContains('uat', $filepath1);
		$this->assertContains('transfer-' . $dataTransfer->ID, $filepath1);

	}
}