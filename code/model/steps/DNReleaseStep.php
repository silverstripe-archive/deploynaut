<?php

class DNReleaseStep extends DataObject {
	public static $db = array(
		"Name" => "Varchar",
		"Sort" => "Int",
	);

	public static $has_one = array(
		"Project" => "DNProject",
	);

	public static $default_sort = "Sort";

	public function getReleaseStatus(DNCommit $commit, $sha) {
		throw new LogicException("getReleaseStatus must be overridden to make a release step class");
	}

	public function getReleaseLink(DNCommit $commit, $sha) {
		throw new LogicException("getReleaseLink must be overridden to make a release step class");
	}

	public function getCMSFields() {
		$fields = parent::getCMSFields();

		$classes = ClassInfo::subclassesFor('DNReleaseStep');
		$classDropdown = new DropdownField("ClassName", "Step type", $classes);
		$fields->addFieldToTab("Root.Main", $classDropdown, "Name");

		return $fields;
	}

}
