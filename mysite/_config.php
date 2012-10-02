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

BasicAuth::protect_entire_site(true);

