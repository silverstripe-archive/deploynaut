# Adding a new project

## Example data

For this example I'm going to create a fictional stage that will be deployed to:

- Server: 127.0.0.1
- Docroot: /sites/fictional/www/
- httpd group: www-data
- User that does the deploy: sites

## Create a project

 1) Login to the Project admin at http://deploynaut/admin/naut/
 2) Click the big green "Add Project" button.
 3) Fill in the required fields:

    * Project name
    * Git repository
    * Project viewers

 4) Save
 5) A yellow notice will tell to you that there is no project folder on disk and asks if you want to create one. Check
 the "Create folder" checkbox and save the project again.
 6) Profit.

## Create an environment for the project

Each environment within each project requires a capistrano config file.

In our case we will create a *fictional* environment in *ss3* project.

 1) Login to the Project admin at http://deploynaut/admin/naut/
 2) Open the ss3 project
 3) Click the "Add" button on the Environments Gridfield at the bottom
 4) Enter "fictional" in the "Environment name"
 5) Save
 6) A yellow notice will tell you that there is no config file for this environment. Check the "Create Config" checkbox
 7) Tick the checkboxes next to the people who should be able to deploy to this environment.
 8) Save

Deploynaut will have created an example config for you in the "Deploy config" text area. Following are the values that you change to fit the fictional environment you will deploy to:

	# The server, either a valid hostname or an IP address and port number
	server '127.0.0.1:22', :web, :db

	# Set your application name here, used as the base folder
	set :application, "fictional"

	# This will be used to chown the deployed files, make sure that the deploy user is part of this group
	set :webserver_group, "www-data"

	# Which SSH user will deploynaut use to SSH into the server
	ssh_options[:username] = 'sites'

9) After you have changed the config, save the environment.

## Test the deployment

Click the "Check Connection" button and deploynaut will run a check to see if it can connect and that it has the correct permission to write so folders.

If you're getting permission problems you need to stick the public key `/sites/deploynaut/www-keys/id_rsa.pub` into the `.ssh/authorized_keys` of the user `sites` that are used for executing commands on the server `127.0.0.1`. This is normally done via sysadmins and puppet scripts to set this up for you.

_Note:_ The first time you add a new server `ipaddress` to the capistrano recipie you need to manually test the connection. Login in as the user running the command. This is how Capistrano logs in to the server. On most deploynaut installs, `www-data` is the user executing the capistrano commands, ssh into deploynaut and issue the following commands:

	$ sudo su www-data 
	$ ssh -i /sites/deploynaut/www-keys/id_rsa sites@127.0.0.1

## Setup the apache docroots and stuff (when the environment isn't managed by puppet)

Following commands will be issued as user on the target server with sudo

	$ sudo mkdir -p /sites/fictional/
	$ sudo mkdir -p releases/ logs shared/assets
	$ sudo chmod -R 775 /sites/fictional/
	$ sudo chown -R sites:www-data /sites/fictional

Create a `/sites/fictional/_ss_environment.php` with the neccessary information, beware of these entries:

	<?php

	// The path will be changed for every release
	global $_FILE_TO_URL_MAPPING;
	$_FILE_TO_URL_MAPPING[realpath(dirname(getcwd()))] = 'http://dnsname/';

and any other database settings so you don't accidentally uses another sites database.
