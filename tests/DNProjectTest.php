<?php


class DNProjectTest extends SapphireTest {

	/**
	 *
	 * @var DNProject
	 */
	protected $project = null;
	
	/**
	 *
	 * @var type 
	 */
	protected $envPath = '';
	
	public function setUp() {
		parent::setUp();
		$this->envPath = '/tmp/deploynaut_test/envs';
		
		Filesystem::makeFolder($this->envPath);
		
		Config::inst()->update('Injector', 'DNData', array(
			'constructor' => array(
				0 => $this->envPath,
				1 => '/tmp/deploynaut_test/gitkeys',
				2 => '/tmp/deploynaut_test/transfers',
			) 
		));
		
		parent::setUp();
		$this->project = new DNProject();
		$this->project->Name = 'testproject';
	}
	
	public function tearDown() {
		parent::tearDown();
		Filesystem::removeFolder($this->envPath);
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
		$this->assertTrue($fields->fieldByName('CreateEnvFolderNotice') instanceof LabelField);
		$this->assertTrue($fields->fieldByName('CreateEnvFolder') instanceof CheckboxField);
	}
	
	public function testSetCreateProjectFolderFieldFolderExists() {
		$this->assertFalse(file_exists($this->envPath.'/'.$this->project->Name), 'project folder shouldnt exist prior to save');
		$this->project->CreateEnvFolder = true;
		$this->project->onBeforeWrite();
		$fields = new FieldList();
		$fields->push(new TextField('Name'));
		$this->project->setCreateProjectFolderField($fields);
		$this->assertNull($fields->fieldByName('CreateEnvFolderNotice'));
		$this->assertNull($fields->fieldByName('CreateEnvFolder'));
	}
}
