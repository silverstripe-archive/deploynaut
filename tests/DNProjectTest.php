<?php


class DNProjectTest extends DeploynautTest {

	protected static $fixture_file = 'DNProjectTest.yml';

	/**
	 * @var DNProject
	 */
	protected $project = null;

	public function setUp() {
		parent::setUp();

		$this->project = DNProject::create();
		$this->project->Name = 'testproject';
	}

	/**
	 *
	 */
	public function testOnBeforeWriteShouldNotCreateCapFolder() {
		$this->assertTrue(file_exists($this->envPath));
		$this->assertFalse(file_exists($this->envPath.'/testproject'));
		$this->project->onBeforeWrite();
		$this->assertFalse(file_exists($this->envPath.'/testproject'), 'Folder should not have been created');
	}

	public function testOnBeforeWriteShouldCreateCapFolder() {
		$this->assertTrue(file_exists($this->envPath));
		$this->assertFalse(file_exists($this->envPath.'/testproject'));
		$this->project->CreateEnvFolder = true;
		$this->project->onBeforeWrite();
		$this->assertTrue(file_exists($this->envPath.'/testproject'), 'Folder should have been created');
	}

	public function testSetCreateProjectFolderFieldNoFolderExists() {
		$fields = new FieldList();
		$fields->push(new TextField('Name'));
		$this->project->setCreateProjectFolderField($fields);
		$this->assertInstanceOf('LabelField', $fields->fieldByName('CreateEnvFolderNotice'));
		$this->assertInstanceOf('CheckboxField', $fields->fieldByName('CreateEnvFolder'));
	}

	public function testSetCreateProjectFolderFieldFolderExists() {
		$this->assertFalse(
			file_exists($this->envPath.'/'.$this->project->Name),
			'project folder shouldnt exist prior to save'
		);
		$this->project->CreateEnvFolder = true;
		$this->project->onBeforeWrite();
		$fields = new FieldList();
		$fields->push(new TextField('Name'));
		$this->project->setCreateProjectFolderField($fields);
		$this->assertNull($fields->fieldByName('CreateEnvFolderNotice'));
		$this->assertNull($fields->fieldByName('CreateEnvFolder'));
	}

	public function testExceededDiskQuota() {
		$project = $this->getMock('DNProject', array('getUsedQuotaMB'));
		$project->expects($this->any())->method('getUsedQuotaMB')->will($this->returnValue(5));
		$project->DiskQuotaMB = 1;
		$this->assertTrue($project->HasExceededDiskQuota());
		$project->DiskQuotaMB = 100;
		$this->assertFalse($project->HasExceededDiskQuota());
	}

	public function testHasDiskQuota() {
		Config::inst()->update('DNProject', 'defaults', array('DiskQuotaMB' => 0));
		$this->assertFalse($this->project->HasDiskQuota());

		Config::inst()->update('DNProject', 'defaults', array('DiskQuotaMB' => 2048));
		$this->assertTrue($this->project->HasDiskQuota());

		$this->project->DiskQuotaMB = 2;
		$this->assertTrue($this->project->HasDiskQuota());
	}

	public function testAllowed() {
		$project = $this->objFromFixture('DNProject', 'firstProject');
		$viewer = $this->objFromFixture('Member', 'viewer');

		$this->assertTrue(
			$project->allowed('FOO_PERMISSION', $viewer),
			'Member that is in the group that has the code, and is in project\'s Viewers, is allowed'
		);
		$this->assertTrue(
			$project->allowed('BAR_PERMISSION', $viewer),
			'Member that has a role that has the code, and is in project\'s Viewers, is allowed'
		);

		$other = $this->objFromFixture('DNProject', 'otherproject');
		$this->assertFalse(
			$other->allowed('FOO_PERMISSION', $viewer),
			'Member that is in the group that has a code, but that is not in project\'s Viewers, is disallowed'
		);
		$this->assertFalse(
			$other->allowed('BAR_PERMISSION', $viewer),
			'Member that has a role that has the code, but that is not in project\'s Viewers, is disallowed'
		);
	}

	public function testAllowedAny() {
		$project = $this->objFromFixture('DNProject', 'firstProject');
		$viewer = $this->objFromFixture('Member', 'viewer');

		$this->assertTrue(
			$project->allowedAny(array('FOO_PERMISSION', 'NONEXISTENT_PERMISSION'), $viewer),
			'Member that is in the group that has the code, and is in project\'s Viewers, is allowed'
		);
		$this->assertTrue(
			$project->allowedAny(array('BAR_PERMISSION', 'NONEXISTENT_PERMISSION'), $viewer),
			'Member that has a role that has the code, and is in project\'s Viewers, is allowed'
		);

	}

	public function testWhoIsAllowed() {
		$project = $this->objFromFixture('DNProject', 'firstProject');
		$this->assertCount(0, $project->whoIsAllowed('NONEXISTENT_PERMISSION'));
		$this->assertDOSEquals(array(
			array('Email' =>'viewer@example.com')
		), $project->whoIsAllowed('FOO_PERMISSION'));
		$this->assertDOSEquals(array(
			array('Email' =>'viewer@example.com')
		), $project->whoIsAllowed('BAR_PERMISSION'));

		$other = $this->objFromFixture('DNProject', 'otherproject');
		$this->assertCount(0, $other->whoIsAllowed('FOO_PERMISSION'));
		$this->assertCount(0, $other->whoIsAllowed('BAR_PERMISSION'));
	}

	public function testWhoIsAllowedAny() {
		$project = $this->objFromFixture('DNProject', 'firstProject');
		$this->assertCount(0, $project->whoIsAllowedAny(array('NONEXISTENT_PERMISSION', 'NONEXISTENT_PERMISSION_2')));
		$this->assertDOSEquals(array(
			array('Email' =>'viewer@example.com')
		), $project->whoIsAllowedAny(array('FOO_PERMISSION', 'NONEXISTENT_PERMISSION')));
		$this->assertDOSEquals(array(
			array('Email' =>'viewer@example.com')
		), $project->whoIsAllowedAny(array('BAR_PERMISSION', 'NONEXISTENT_PERMISSION')));
	}

	/**
	 *
	 */
	public function testFooGroupIsAllowedToFooPermission() {
		$firstProject = $this->objFromFixture('DNProject', 'firstProject');
		$firstGroup = $this->objFromFixture('Group', 'firstWithCodeFoo');
		$isAllowed = $firstProject->groupAllowed('FOO_PERMISSION', $firstGroup);
		$this->assertTrue($isAllowed, 'Expected that foo group is allowed to foo perm');
	}

	public function testFooGroupIsNotAllowedToBarPermission() {
		$project = $this->objFromFixture('DNProject', 'firstProject');
		$fooGroup = $this->objFromFixture('Group', 'firstWithCodeFoo');
		$isAllowed = $project->groupAllowed('BAR_PERMISSION', $fooGroup);
		$this->assertFalse($isAllowed, 'Expected that foo group should not have access to bar perm');
	}

	public function testBarGroupIsAllowedToBarPermission() {
		$firstProject = $this->objFromFixture('DNProject', 'firstProject');
		$secondGroup = $this->objFromFixture('Group', 'secondWithRoleBar');
		$isAllowed = $firstProject->groupAllowed('BAR_PERMISSION', $secondGroup);
		$this->assertTrue($isAllowed, 'Group should have "bar" PermissionRoleCode');
	}

	public function testSecondGroupIsNotAllowedToFirstProject() {
		$firstProject = $this->objFromFixture('DNProject', 'firstProject');
		$thirdGroup = $this->objFromFixture('Group', 'thirdWithCodeFoo');
		$isAllowed = $firstProject->groupAllowed('FOO_PERMISSION', $thirdGroup);
		$this->assertFalse($isAllowed, 'Expected that non project group should be denied');
	}

	public function testNonViewerGroupAllowedIsFalse() {
		$otherProject = $this->objFromFixture('DNProject', 'otherproject');
		$firstGroup = $this->objFromFixture('Group', 'firstWithCodeFoo');
		$isAllowed = $otherProject->groupAllowed('FOO_PERMISSION', $firstGroup);
		$this->assertFalse($isAllowed, 'Expected that non project group should be denied');
	}
}
