<?php

/**
 * Class ResqueJob
 *
 * Used in the Resque report admin
 *
 */
class ResqueJob extends ViewableData {

	/**
	 * @var array
	 */
	protected $record = array();

	/**
	 * @param array $data
	 */
	public function __construct($data = array()) {
		$this->record = $data;
	}

	/**
	 * @return string
	 */
	public function i18n_singular_name() {
		return 'Resque queue';
	}

	/**
	 * @return boolean
	 */
	public function canView() {
		return true;
	}

	/**
	 * @return bool
	 */
	public function canEdit() {
		return false;
	}

	/**
	 * @return bool
	 */
	public function candelete() {
		return false;
	}

	/**
	 * @return bool
	 */
	public function cancreate() {
		return false;
	}

	/**
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
