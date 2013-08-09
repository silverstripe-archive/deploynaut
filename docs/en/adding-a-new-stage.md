# Adding a new project

## Example data

For this example I'm going to create a fictional stage that will be deployed to:

- Server: 127.0.0.1
- Docroot: /sites/fictional/www/
- httpd group: www-data
- User that does the deploy: silvers

## Create an environment for the project

Each environment within each project requires a config file.

In our case we will create a *fictional* environment in *ss3* project.

Create config file in `../deploynaut-resources/configs/ss3/fictional.rb` (relative to deploynaut webroot)

	## Application name and deployment path
	set :application, "fictional"
	## Base folder 
	set :deploy_to, "/sites/#{application}"

	# This will be used to chown the deployed files, make sure that the deploy user is part of this group
	set :webserver_group, "silvers"

	## Target server(s)
	server '202.175.137.226', :web, :db

	## SSH port to use
	ssh_options[:port] = 22
	## The user that are used for login in to the server
	ssh_options[:username] = 'silvers'
	## The SSH ident keys that will be user for passwordless login
	ssh_options[:keys] = '/sites/deploynaut/www-keys/id_rsa'

## Test the deployment

Test you environment by running a simple Capistrano command for requesting the uptime:

	$ cap ss3:fictional info:uptime

This should return the uptime for the server. If you're getting permission problems you need to stick the public key `/sites/deploynaut/www-keys/id_rsa.pub` into the `.ssh/authorized_keys` of the user `silvers` that are used for executing commands on the server `127.0.0.1`./sites/deploynaut/www-keys/id_rsa

_Note:_ The first time you add a new server `ipadress` to the capistrano recipie you need to manually test the connection. Login in as the user running the command. This is how Capistrano logs in to the server.

On [deploynaut.silverstripe.com/](http://deploynaut.silverstripe.com/) `www-data` is the user executing the capistrano commands.

	$ sudo su www-data 
	$ ssh -i /sites/deploynaut/www-keys/id_rsa silvers@127.0.0.1

## Setup the apache docroots and stuff

Following commands will be issued as user on the target server with sudo

	$ sudo mkdir -p /sites/fictional/
	$ sudo mkdir -p releases/ logs shared/assets
	$ sudo chmod -R 775 /sites/fictional/
	$ sudo chown -R silvers:www-data /sites/fictional


Create a `/sites/fictional/_ss_environment.php` with the neccessary information, beware of these entries:

	<?php

	// The path will be changed for every release
	global $_FILE_TO_URL_MAPPING;
	$_FILE_TO_URL_MAPPING[realpath(dirname(getcwd()))] = 'http://dnsname/';

and any other database settings so you don't accidentally uses another sites database

Set up a vhost that points to the correct docroot

## Check dependencies

Back at the deploynaut test the setup

	$ sudo su www-data
	$ cap ss3:fictional deploy:check

## Test deploy!

	$ cap ss3:fictional deploy -s build=aa-b161




