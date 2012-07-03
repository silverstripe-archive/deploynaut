# Deploynaut

The deploynaut is a blend of a SS Website and [Capistrano](https://github.com/capistrano/capistrano/) recipies to manage deployment of SilverStripe sites. Capistrano has for a long time been a popular choice for exectuting shell commands on a remote server. 

## Capistrano Installation

Capistrano is written in ruby, and often deployed as a ruby gem. So the first requirement is to Installing it system wide (without supporting ri and docs) is done by:

	$ sudo gem install capistrano --no-ri --no-rdoc

Our implementation also relies on having multiple stages, such as dev, staging and live. This is supported by installing an extension to capistrano

	$ sudo gem install capistrano-ext --no-ri --no-rdoc

## Deploynaut installation

First get the base code for the project

	mkdir deploynaut.dev && cd deploynaut.dev
	git clone ssh://git@gitorious.silverstripe.com:2222/infrastructure/deploynaut.git www 

Now it's time to create folders and checkout dependent silverstripe modules

	cd www && phing

## Test the Capistrano 

Now you should be able to test that capistrano works as intented.

	cap dojo info:uptime

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