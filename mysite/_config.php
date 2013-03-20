<?php

global $project;
$project = 'mysite';

global $database;
$database = 'deploynaut';

require_once('conf/ConfigureFromEnv.php');

MySQLDatabase::set_connection_charset('utf8');

SSViewer::set_theme('deploynaut');

BasicAuth::protect_entire_site(true, "DEPLOYNAUT_ACCESS");

if(defined('IS_SSL') && IS_SSL) Director::forceSSL();

if(!defined('DEPLOYNAUT_LOG_PATH')) define('DEPLOYNAUT_LOG_PATH', TEMP_FOLDER . '/_deploynaut_logs');
if(!defined('DEPLOYNAUT_LOCAL_VCS_PATH')) define('DEPLOYNAUT_LOCAL_VCS_PATH', TEMP_FOLDER . '/_local_repos');

if(!file_exists(DEPLOYNAUT_LOG_PATH)) mkdir(DEPLOYNAUT_LOG_PATH);
if(!file_exists(DEPLOYNAUT_LOCAL_VCS_PATH)) mkdir(DEPLOYNAUT_LOCAL_VCS_PATH);
