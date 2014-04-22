# Deploynaut

The deploynaut is a blend of a SS Website and [Capistrano](https://github.com/capistrano/capistrano/) recipies to manage deployment of SilverStripe sites. Capistrano has for a long time been a popular choice for exectuting shell commands on a remote server.

Originally it has been written to support the deployments of Rails applications. We reuse a lot of the original code, but some of it has to be customised to fit with our infrastructure.

## System Requirements

You'll need a few system tools on the Deploynaut host to get started:

 * git
 * tar
 * [SSPak](http://sminnee.github.io/sspak/) (see below)
   * Until changes are merged back, you'll want [halkyon's branch](https://github.com/halkyon/sspak/tree/existing_save)

We also assume that each Deploynaut target has the following tools installed
and available in the user's `$PATH`:

 * tar
 * gunzip
 * php
 * mysqldump

## Capistrano Installation

Capistrano is written in ruby, and often deployed as a ruby gem. So the first requirement is to install it system wide (without supporting ri and docs):

	$ sudo gem install capistrano --no-ri --no-rdoc --verbose -v 2.15.5

Our implementation relies on capistrano-multiconfig extension which provides us with the ability to have multiple projects, each with serveral configurations (stages):

	$ sudo gem install capistrano-multiconfig --no-ri --no-rdoc --verbose -v 0.0.4

## Deploynaut installation

First get the base code for the project

	mkdir deploynaut.dev && cd deploynaut.dev
	git clone ssh://git@gitorious.silverstripe.com:2222/infrastructure/deploynaut.git www 

Now it's time to create folders and checkout dependent silverstripe modules

	cd www && phing

Deploynaut expects that the following directory structure is present (from the site root):

	../deploynaut-resources/builds/
	../deploynaut-resources/configs/

Within each of these the project folders should be added - these names will be mapped to each another when deploying, eg:

	../deploynaut-resources/builds/ss3
	../deploynaut-resources/configs/ss3/dev.rb

## Configuring environment

We suggest to set up the following in the `_ss_environment.php` file:

	define('DEPLOYNAUT_LOG_PATH', '/sites/deploynaut/www/assets/_deploynaut_logs');

	// we are using /var/tmp instead of /tmp so that the files are persisted between reboots
	define('DEPLOYNAUT_LOCAL_VCS_PATH', '/var/tmp/deploynaut_local_vcs');
	define('DEPLOYNAUT_ADMIN_EMAIL', 'deploy@silverstripe.com');
	define('DEPLOYNAUT_ERROR_EMAIL', 'deploy@silverstripe.com');
	define('DEPLOYNAUT_SSH_KEY', '/var/www/.ssh/id_rsa');

	global $_FILE_TO_URL_MAPPING;
	$_FILE_TO_URL_MAPPING['/sites/deploynaut/www'] = 'http://<your-url>'

## Configuring snapshots

Create `assets/transfers` server-writable directory:

	mkdir assets/transfers
	chown www-data.www-data assets/transfers
	chmod 755 assets/transfers

Add `assets/.htaccess` to enable security checks on files:

	RewriteEngine On
	RewriteBase /
	RewriteCond %{REQUEST_URI} ^(.*)$
	RewriteRule .* framework/main.php?url=%1 [QSA]

See below in "Snapshot security" for essential information on securing files.

Add `assets/_combinedfiles/.htaccess` to allow direct serving of combined files:

	RewriteEngine Off

The [SSPak](https://github.com/sminnee/sspak) tool is required to create
archives of the database/assets for a specific environment into an `*.sspak` file.
This file can be used for backups, restores, and setting up local development environments.

	wget --no-check-certificate https://raw.github.com/silverstripe/sspak/gh-pages/sspak.phar; sudo cp sspak.phar /usr/local/bin/sspak

Set up feature flags in `_ss_environment.php`:

	// Enable for beta testers.
	//define('FLAG_SNAPSHOTS_ENABLED_FOR_MEMBERS', 'tester1@somewhere.com;tester2@somewhere.com');
	// Enable for everyone.
	define('FLAG_SNAPSHOTS_ENABLED', true);

## Test the Capistrano

Now you should be able to test that capistrano works as intented.

	cap ss3:dev info:uptime

This should give you the results from running the uptime command on the dojo server (at the time of this being written; oscar).

You can see a bunch of tasks that can be run by issuing this 

	cap -T

## Snapshot security

Deploynaut provides the ability to backup database and/or assets from a specific environment
and store them as an [SSPak](http://sminnee.github.io/sspak/) snapshot on the Deploynaut filesystem.
These backups can be used to restore data onto an environment, or transfer it to a different environment.

All snapshots are stored within the deploynaut webroot under the `assets/` folder.
Downloads are secured through the [secureassets](https://github.com/silverstripe-labs/silverstripe-secureassets),
with permission checks enforced through Apache's `mod_rewrite` module.
Please create a file `assets/.htaccess` with the following content:

	RewriteEngine On
	RewriteBase /
	RewriteCond %{REQUEST_URI} ^(.*)$
	RewriteRule .* framework/main.php?url=%1 [QSA]

Permissions are granted in the CMS on a per-group basis, separately for the following actions:

 * *Download* an existing snapshot from Deploynaut to your local development environment
 * *Upload* an snapshot created from your local development environment into Deploynaut
 * *Backup* an environment into a new snapshot stored on Deploynaut
 * *Restore* an existing snapshot into an environment (overwriting existing data)

Since we can't rely on the webserver having enough space to create snapshots,
their data is downloaded into a temporary folder on the Deploynaut filesystem first.
Please ensure you have sufficient filesystem space available for creating snapshots
(at least twice the amount of uncompressed data on the environments).

Caution: Backups of databases on dedicated servers (separate from the webserver) are currently not supported.

## Troubleshooting

*Q: The deployment script log is not showing up, and the "Executing:" is not showing the command.*

The deployment relies on deploynaut.js file being available. For some reason it is not executing - check if the webserver can write to assets (it is trying to combine JS files into this directory).

*Q: The file upload fails with "no such file".

Make sure you are not using relative paths (e.g. ~)
