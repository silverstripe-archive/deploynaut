<?php
/**
 * Class TimezoneMemberExtension.
 *
 * Adds all available timezones as an optional field to SilverStripe {@link Member}.
 */
class TimezoneMemberExtension extends DataExtension {
	private static $db = [
		'Timezone' => 'Varchar(255)',
	];

	public function getTimezones() {
		$timezones = timezone_identifiers_list();
		return array_combine($timezones, $timezones);
	}

	public function updateCMSFields(FieldList $fields) {   
		$fields->removeFieldFromTab('Root', 'Timezone');
		$field = DropdownField::create(
			'Timezone',
			'Timezone',
		  $this->getTimezones())->setEmptyString('For NZ, choose Pacific/Auckland');
		$fields->addFieldToTab('Root.timezone', $field);
		return $fields;
	}

}
