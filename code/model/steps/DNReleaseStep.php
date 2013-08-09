<?php

class DNReleaseStep extends DataObject {
	static $db = array(
		"Name" => "Varchar",
		"Sort" => "Int",
	);

	static $has_one = array(
		"Project" => "DNProject",
	);

	static $default_sort = "Sort";

	function getReleaseStatus(DNCommit $commit, $sha) {
		throw new LogicException("getReleaseStatus must be overridden to make a release step class");
	}

	function getReleaseLink(DNCommit $commit, $sha) {
		throw new LogicException("getReleaseLink must be overridden to make a release step class");
	}

	function getCMSFields() {
		$fields = parent::getCMSFields();

		$classes = ClassInfo::subclassesFor('DNReleaseStep');
		$classDropdown = new DropdownField("ClassName", "Step type", $classes);
		$fields->addFieldToTab("Root.Main", $classDropdown, "Name");

		return $fields;
	}

}