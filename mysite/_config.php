<?php

global $project;
$project = 'mysite';

global $database;
$database = 'deploynaut';

require_once('conf/ConfigureFromEnv.php');

MySQLDatabase::set_connection_charset('utf8');

SSViewer::set_theme('deploynaut');

BasicAuth::protect_entire_site(true);

if(defined('IS_SSL') && IS_SSL) Director::forceSSL();
