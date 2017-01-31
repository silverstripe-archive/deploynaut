<?php

class DeploynautMemberExtension extends DataExtension {

	/**
	 * @var array
	 */
	private static $db = [
		'Timezone' => 'Varchar(255)',
	];

	/**
	 * @var array
	 */
	private static $belongs_many_many = [
		'StarredProjects' => 'DNProject'
	];

	public function updateCMSFields(\FieldList $fields) {
		$fields->removeFieldFromTab('Root', 'Timezone');
		$field = DropdownField::create(
			'Timezone',
			'Timezone',
		$this->getTimezones())->setEmptyString('Select timezone');
		$fields->insertBefore('DateFormat', $field);
		return $fields;
	}

	public function getTimezones() {
		$timezones = timezone_identifiers_list();
		return array_combine($timezones, $timezones);
	}

}
