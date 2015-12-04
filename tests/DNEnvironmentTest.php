<?php
/**
 *
 */
class DNEnvironmentTest extends DeploynautTest {
	/**
	 * @var string
	 */
	protected static $fixture_file = 'DNEnvironmentTest.yml';

	/**
	 * @return DNEnvironment
	 */
	protected function getEnvironment() {
		return $this->objFromFixture('DNEnvironment', 'uat');
	}

	/**
	 *
	 */
	public function testGetConfigFilename() {
		$environment = $this->getEnvironment();
		$expected = $this->envPath . '/testproject/uat.rb';
		$this->assertEquals($expected, $environment->getConfigFilename());
	}

	public function testPermissions() {
		$environment = $this->getEnvironment();

		// Check deployer / restorer permissions
		$viewer = $this->objFromFixture('Member', 'viewer');
		$viewerbygroup = $this->objFromFixture('Member', 'viewerbygroup');
		$deployer = $this->objFromFixture('Member', 'deployer');
		$deployerbygroup = $this->objFromFixture('Member', 'deployerbygroup');
		$restorer = $this->objFromFixture('Member', 'restorer');
		$restorerbygroup = $this->objFromFixture('Member', 'restorerbygroup');

		$random = new Member(array('Email' => 'random@example.com'));
		$random->write();

		$this->assertFalse($environment->canView($random));
		$this->assertTrue($environment->canView($viewer));
		$this->assertTrue($environment->canView($viewerbygroup));

		$this->assertTrue($environment->canDeploy($deployer));
		$this->assertTrue($environment->canDeploy($deployerbygroup));
		$this->assertFalse($environment->canDeploy($restorer));
		$this->assertFalse($environment->canDeploy($restorerbygroup));

		$this->assertFalse($environment->canRestore($deployer));
		$this->assertFalse($environment->canRestore($deployerbygroup));
		$this->assertTrue($environment->canRestore($restorer));
		$this->assertTrue($environment->canRestore($restorerbygroup));

		// Check backup / uploader permissions
		$backup = $this->objFromFixture('Member', 'backup');
		$backupbygroup = $this->objFromFixture('Member', 'backupbygroup');
		$uploader = $this->objFromFixture('Member', 'uploader');
		$uploaderbygroup = $this->objFromFixture('Member', 'uploaderbygroup');

		$this->assertTrue($environment->canBackup($backup));
		$this->assertTrue($environment->canBackup($backupbygroup));
		$this->assertFalse($environment->canBackup($uploader));
		$this->assertFalse($environment->canBackup($uploaderbygroup));

		$this->assertFalse($environment->canUploadArchive($backup));
		$this->assertFalse($environment->canUploadArchive($backupbygroup));
		$this->assertTrue($environment->canUploadArchive($uploader));
		$this->assertTrue($environment->canUploadArchive($uploaderbygroup));

		// Check downloader / deleters permissions
		$downloader = $this->objFromFixture('Member', 'downloader');
		$downloaderbygroup = $this->objFromFixture('Member', 'downloaderbygroup');
		$deleter = $this->objFromFixture('Member', 'deleter');
		$deleterbygroup = $this->objFromFixture('Member', 'deleterbygroup');

		$this->assertTrue($environment->canDownloadArchive($downloader));
		$this->assertTrue($environment->canDownloadArchive($downloaderbygroup));
		$this->assertFalse($environment->canDownloadArchive($deleter));
		$this->assertFalse($environment->canDownloadArchive($deleterbygroup));

		$this->assertFalse($environment->canDeleteArchive($downloader));
		$this->assertFalse($environment->canDeleteArchive($downloaderbygroup));
		$this->assertTrue($environment->canDeleteArchive($deleter));
		$this->assertTrue($environment->canDeleteArchive($deleterbygroup));

		// Pipeline permissions
		$approver = $this->objFromFixture('Member', 'approver');
		$approverbygroup = $this->objFromFixture('Member', 'approverbygroup');
		$canceller = $this->objFromFixture('Member', 'canceller');
		$cancellerbygroup = $this->objFromFixture('Member', 'cancellerbygroup');

		$this->assertTrue($environment->canApprove($approver));
		$this->assertTrue($environment->canApprove($approverbygroup));
		$this->assertFalse($environment->canApprove($canceller));
		$this->assertFalse($environment->canApprove($cancellerbygroup));

		$this->assertFalse($environment->canAbort($approver));
		$this->assertFalse($environment->canAbort($approverbygroup));
		$this->assertTrue($environment->canAbort($canceller));
		$this->assertTrue($environment->canAbort($cancellerbygroup));
	}

	private function checkSnapshots($assert, $env, $member) {
		$this->$assert($env->canRestore($member));
		$this->$assert($env->canBackup($member));
		$this->$assert($env->canDownloadArchive($member));
		$this->$assert($env->canDeleteArchive($member));
	}

	public function testAllows() {
		$prod = $this->objFromFixture('DNEnvironment', 'allowtest-prod');
		$uat = $this->objFromFixture('DNEnvironment', 'allowtest-uat');
		$this->assertTrue($prod->canDeploy($this->objFromFixture('Member', 'allowProdDeployment')));
		$this->assertFalse($prod->canDeploy($this->objFromFixture('Member', 'allowNonProdDeployment')));
		$this->assertFalse($uat->canDeploy($this->objFromFixture('Member', 'allowProdDeployment')));
		$this->assertTrue($uat->canDeploy($this->objFromFixture('Member', 'allowNonProdDeployment')));

		$this->checkSnapshots('assertTrue', $prod, $this->objFromFixture('Member', 'allowProdSnapshot'));
		$this->checkSnapshots('assertFalse', $prod, $this->objFromFixture('Member', 'allowNonProdSnapshot'));
		$this->checkSnapshots('assertFalse', $uat, $this->objFromFixture('Member', 'allowProdSnapshot'));
		$this->checkSnapshots('assertTrue', $uat, $this->objFromFixture('Member', 'allowNonProdSnapshot'));
	}

	public function testViewerPermissionInheritedFromProjectIfNotConfigured() {
		$environment = $this->objFromFixture('DNEnvironment', 'dev');
		$viewerbygroup = $this->objFromFixture('Member', 'viewerbygroup');

		$random = new Member(array('Email' => 'random@example.com'));
		$random->write();

		$this->assertFalse($environment->canView($random));
		$this->assertTrue($environment->canView($viewerbygroup));
	}

	public function testBackendIdentifierField() {
		// Two backends means that there will be a dropdown field
		$backends = array(
			'BackendOne' => 'One',
			'BackendTwo' => 'Two',
		);

		Config::inst()->remove('DNEnvironment', 'allowed_backends');
		Config::inst()->update('DNEnvironment', 'allowed_backends', $backends);

		$environment = $this->objFromFixture('DNEnvironment', 'dev');
		$fields = $environment->getCMSFields();
		$this->assertEquals($backends, $fields->dataFieldByName('BackendIdentifier')->getSource());


		// One backend means that there won't
		Config::inst()->remove('DNEnvironment', 'allowed_backends');
		Config::inst()->update('DNEnvironment', 'allowed_backends', array('BackendOne' => 'One'));

		$fields = $environment->getCMSFields();
		$this->assertNull($fields->dataFieldByName('BackendIdentifier'));
	}
}

class BackendOne extends DemoDeploymentBackend implements TestOnly {

}

class BackendTwo extends DemoDeploymentBackend implements TestOnly  {

}

