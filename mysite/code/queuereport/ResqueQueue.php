<?php

class ResqueQueue extends ViewableData {
	
	/**
	 *
	 * @var array
	 */
	protected $record = array();

	/**
	 * 
	 * @param array $data
	 */
	public function __construct($data = array()) {
		$this->record = $data;
	}

	/**
	 * 
	 * @return \FieldList
	 */
	public function getCMSFields() {
		$fieldList = new FieldList();
		$fieldList->push(new ReadonlyField('Name', 'Name', $this->Name));
		$fieldList->push(new ReadonlyField('Size', 'Size', $this->Size));
		$jobs = new GridField('Jobs', 'Jobs', $this->getJobs());
		$dataComponent = $jobs->getConfig()->getComponentByType('GridFieldDataColumns');
		$dataComponent->setDisplayFields(array(
			'Name' => 'Name',
			'Value' => 'Value',
		));
		$fieldList->push($jobs);
		return $fieldList;
	}

	/**
	 * 
	 * @return string
	 */
	public function i18n_singular_name() {
		return 'Resque queue';
	}

	protected function getJobs() {
		$jobs = new ArrayList();
		
		$resqueJobs = Resque::redis()->lrange('queue:' . $this->Name, 0, -1);
		if(!$resqueJobs) {
			$jobs->push(new ResqueJob(array(
				'Name' => 'null',
				'Value' => 'null',
			)));
			return $jobs;
		}
		foreach($resqueJobs as $idx => $job) {
			$stdClass = json_decode($job);
			if($stdClass->class === 'CapistranoDeploy') {
				$jobs->push(new ResqueJob(array(
					'Name' => $stdClass->class,
					'Value' => $stdClass->args[0]->projectName . ':' . $stdClass->args[0]->environment . ' - ' . $stdClass->args[0]->sha,
				)));
			} else {
				$jobs->push(new ResqueJob(array(
					'Name' => $stdClass->class,
					'Value' => var_export($stdClass->args[0], true),
				)));
			}
		}
		
		return $jobs;
	}

	/**
	 * 
	 * @return boolean
	 */
	public function canView() {
		return true;
	}

	/**
	 * 
	 * @return bool
	 */
	public function canEdit() {
		return true;
	}

	/**
	 * 
	 * @return bool
	 */
	public function candelete() {
		return false;
	}

	/**
	 * 
	 * @return bool
	 */
	public function cancreate() {
		return false;
	}

	/**
	 * 
	 * @param string $property
	 * @return mixed
	 */
	public function __get($property) {
		if(isset($this->record[$property])) {
			return $this->record[$property];
		}
		return null;
	}

}
