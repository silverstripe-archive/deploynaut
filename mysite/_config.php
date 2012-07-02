<?php

global $project;
$project = 'mysite';

global $database;
$database = 'deploynaut';

require_once('conf/ConfigureFromEnv.php');

MySQLDatabase::set_connection_charset('utf8');

// Set the current theme. More themes can be
// downloaded from http://www.silverstripe.org/themes/
SSViewer::set_theme('deploynaut');

Director::addRules(51, array(
	'' => '->naut',
	'naut' => 'DNRoot',
));

DNData::set_environment_names(array(
	"internal_dev",
	"internal_live",
	"idp_dojo",
	'test-ss3',
	"dojo"
));
