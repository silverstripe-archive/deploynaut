<?php

Deprecation::notification_version('1.1.0', 'deploynaut');

// *.sspak is required for data archives
$exts = Config::inst()->get('File', 'allowed_extensions');
$exts[] = 'sspak';
Config::inst()->update('File', 'allowed_extensions', $exts);

Resque_Event::listen('onFailure', function(Exception $exception, Resque_job $job) {
	$inst = $job->getInstance();
	if($inst instanceof DeploynautJobInterface) {
		$inst->onFailure($exception);
	}
});
