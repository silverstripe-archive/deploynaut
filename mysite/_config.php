<?php

global $project;
$project = 'mysite';

global $database;
$database = 'deploynaut';

require_once('conf/ConfigureFromEnv.php');

MySQLDatabase::set_connection_charset('utf8');

SSViewer::set_theme('deploynaut');

BasicAuth::protect_entire_site(true);

if(defined('DEPLOYNAUT_BUILD_DIR')) {
	DNData::set_builds_dir(DEPLOYNAUT_BUILD_DIR);
} else {
	DNData::set_builds_dir(BASE_PATH.'/../deploynaut-resources/builds');
}

if(defined('DEPLOYNAUT_ENVIRONMENT_DIR')) {
	DNData::set_environment_dir(DEPLOYNAUT_ENVIRONMENT_DIR);
} else {
	DNData::set_environment_dir(BASE_PATH.'/../deploynaut-resources/envs');
}
