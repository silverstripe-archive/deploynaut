# Deploynaut

The deploynaut is a blend of a SS Website and [Capistrano](https://github.com/capistrano/capistrano/) recipies to manage deployment of SilverStripe sites. Capistrano has for a long time been a popular choice for exectuting shell commands on a remote server.

Originally it has been written to support the deployments of Rails applications. We reuse a lot of the original code, but some of it has to be customised to fit with our infrastructure.

## Capistrano Installation

Capistrano is written in ruby, and often deployed as a ruby gem. So the first requirement is to Installing it system wide (without supporting ri and docs) is done by:

	$ sudo gem install capistrano --no-ri --no-rdoc --verbose -v 2.15.5

Our implementation relies on capistrano-multiconfig extension which provides us with the ability to have multiple projects, each with serveral configurations (stages):

	$ sudo gem install capistrano-multiconfig --no-ri --no-rdoc --verbose -v 0.0.4

## SSPak Installation

The [SSPak](https://github.com/sminnee/sspak) tool is required to create
archives of the database/assets for a specific environment into an `*.sspak` file.
This file can be used for backups, restores, and setting up local development environments.

	$ curl -sS http://sminnee.github.io/sspak/install | php -- /usr/local/bin

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

## Test the Capistrano 

Now you should be able to test that capistrano works as intented.

	cap ss3:dev info:uptime

This should give you the results from running the uptime command on the dojo server (at the time of this being written; oscar).

You can see a bunch of tasks that can be run by issuing this 

	cap -T

## Testing Deploynaut

First add an _ss_environment.php file, here is a sample:

	define('SS_ENVIRONMENT_TYPE', 'dev');
	define('SS_DATABASE_SERVER', 'localhost');
	define('SS_DATABASE_USERNAME', 'deploynaut');
	define('SS_DATABASE_PASSWORD', 'password');
	define('SS_DEFAULT_ADMIN_USERNAME', 'admin');
	define('SS_DEFAULT_ADMIN_PASSWORD', 'password');
	$_FILE_TO_URL_MAPPING['/path/to/deploynaut'] = 'http://localhost/';

## Backups and Restores

Deploynaut provides the ability to backup database and/or assets from a specific environment
and store them as an [SSPak](http://sminnee.github.io/sspak/) archive on the Deploynaut filesystem.
These backups can be used to restore data onto an environment, or transfer it to a different environment.

All backups are stored within the deploynaut webroot under the `assets/` folder.
If you give users the permission to create backups, please ensure you have sufficient filesystem space available for this purpose.

## Troubleshooting

*Q: The deployment script log is not showing up, and the "Executing:" is not showing the command.*

The deployment relies on deploynaut.js file being available. For some reason it is not executing - check if the webserver can write to assets (it is trying to combine JS files into this directory).

*Q: The file upload fails with "no such file".

Make sure you are not using relative paths (e.g. ~)
