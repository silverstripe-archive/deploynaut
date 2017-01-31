<?php

// *.sspak is required for data archives
$exts = Config::inst()->get('File', 'allowed_extensions');
$exts[] = 'sspak';
Config::inst()->update('File', 'allowed_extensions', $exts);

// This will ensure jobs can correctly clean themselves up on any type of failure
Resque_Event::listen('onFailure', function(Exception $exception, Resque_job $job) {
	$inst = $job->getInstance();
	if($inst instanceof DeploynautJobInterface) {
		$inst->onFailure($exception);
	}
});

// set default from address in emails, unless otherwise overriden by specific emails
if(defined('DEPLOYNAUT_ADMIN_EMAIL')) {
	Config::inst()->update('Email', 'admin_email', DEPLOYNAUT_ADMIN_EMAIL);
}

// send fatal errors and warnings to the defined error email
if(defined('DEPLOYNAUT_ERROR_EMAIL')) {
	SS_Log::add_writer(new SS_LogEmailWriter(DEPLOYNAUT_ERROR_EMAIL), SS_Log::WARN, '<=');
}

if (!defined('DEPLOYNAUT_LOG_PATH')) {
	throw new RuntimeException('You must set the DEPLOYNAUT_LOG_PATH in _ss_environment.php');
}
if (!defined('DEPLOYNAUT_LOCAL_VCS_PATH')) {
	throw new RuntimeException('You must set the DEPLOYNAUT_LOCAL_VCS_PATH in _ss_environment.php');
}

if (!defined('DEPLOYNAUT_SSH_KEY')) {
	throw new RuntimeException('You must set the DEPLOYNAUT_SSH_KEY in _ss_environment.php. It should point to a private keyfile');
}

if (!file_exists(DEPLOYNAUT_LOG_PATH)) {
	mkdir(DEPLOYNAUT_LOG_PATH, 0777, true);
	// Make sure the cli and www have write access to this folder
	chmod(DEPLOYNAUT_LOG_PATH, 0777);
}
if (!file_exists(DEPLOYNAUT_LOCAL_VCS_PATH)) {
	mkdir(DEPLOYNAUT_LOCAL_VCS_PATH, 0777, true);
	// Make sure the cli and www have write access to this folder
	chmod(DEPLOYNAUT_LOCAL_VCS_PATH, 0777);
}
