<?php

Deprecation::notification_version('1.1.0', 'deploynaut');

// *.sspak is required for data archives
$exts = Config::inst()->get('File', 'allowed_extensions');
$exts[] = 'sspak';
Config::inst()->update('File', 'allowed_extensions', $exts);
