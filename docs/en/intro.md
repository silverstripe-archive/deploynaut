# How to make your site be deployable

The new deploynaut is opinionated in that sense that you it only do deployments for projects under certain circomstances.

 1. You can access the target webservers with SSH.
 2. The login is handled by public keys.
 3. The code can be reachable via git where the a pubkey is allowing the www-data@deploy.silverstripe.com to access the code.

### tl;dr

This is the short version:

1. Add deploynauts pubkey to servers and git
2. Manually try the SSH connection from the www-data user
3. Add environment file to the deploynaut resources
4. Setup docroot structure on servers
5. Run the [Sync projects and environments](http://deploy.silverstripe.com/dev/tasks/SyncProjectsAndEnvironments) task.
6. Set git path and collaborators in [Deploynaut Projects](http://deploy.silverstripe.com/admin/naut/DNProject)
7. Deploy

## SSH and GIT access

### Access to the servers

First you need to add this public key to whatever user the deploy will be run under:

	ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDtp5CJSdlLxFUYfVGx12TH1v51XBmaafbA2lNu38xTLZUL3JPjexPTyfUqsZKbz5fPrTVdemvEl/OQeSHFGpT5tlu/3SPSe4+vspW3WIrzfdtPTsa7S58QGBeC3lDqOv+foR0xWTKLvCmAHSj0ypUuKYVdG/R5vTiyRAcvwAvU98Cqj3Of6TDjPimAgoze2ydKkGlc492XudKs4Qpu9kK6/TcikUlB8gJl1+FiaBlKGdCiyH5EXLXMjGpoaycNMg1zPKdkqZILgIWmSbjjCaKRVdMW8g7cIgnTcUdKoxw2qvAz8Ka6W7I1lGJxwvdiS91ewwrYk/J+zATSxSy26+g5 www-data@devtools

This key should be appended to the `.ssh/authorized_keys` for every server that the code will be deployed to.

### Setting up access to git

There need to be a user that has read access to the git repository. In gitorious there is a user `deploy` that can be added to a team or a project. Otherwise the above public key needs to be added to a user with access.

### Known Hosts bug

The first time you deploy may fail due to Capistrano can't find the server in the known host file for the user deploying.

	# The authenticity of host 'server.com (192.168.1.1)' can't be established.
	# RSA key fingerprint is 16:27:ac:a5:76:28:2d:36:63:1b:56:4d:eb:df:a6:48.
	# Are you sure you want to continue connecting (yes/no)?

To fix this, ssh into deploy.silverstripe.com and run these commands and answer yes

	sudo su - www-data
	ssh -p2222 sites@192.168.0.1

## Environment files

You will need to add a configuration that describes where how deploys will be executed on the target servers. Following is an example of a environment file

	# Your HTTP server
	server 'oscar.wgtn.silverstripe.com', :web, :db

	# Set your application name here.
	set :application, "chrysalis.dojo"

	# The path on the servers we’re going to be deploying the application to.
	set :deploy_to, "/sites/#{application}"

	# Set a build script that is run before the code .tar.gz is sent to the server. This build script can do
	# things like composer update, removing non needed files (docs, build artifacts dev only files) and so on.
	set :build_script, "phing -logger phing.listener.NoBannerLogger -f build/phing.build.xml composer-install"

	# This will be used to chown the deployed files, make sure that the deploy user is part of this group
	set :webserver_group, "sites"

	# SSH options
	ssh_options[:username] = 'dojo'
	ssh_options[:port] = 2222

This needs to go into repo X at X and then pulled on the deploy servers

	$ cd /sites/deploy/deploynaut-resources/envs
	$ git pull origin

## Docroot structure

You can deploy anywhere on the server, but deploynaut expects a certain structure (or capistrano expects it).

If for example `/sites/awesome` is the "docroot" for the project, the following folder should must exists under it:

	/sites/awesome/releases
	/sites/awesome/shared
	/sites/awesome/shared/assets

### The www folder
Note that the "real" docroot that virtual host configuration will need to refer to is a symlink named `www` that i.e. links to `releases/20130429022938`. If this is currently a real folder, it will need to moved out of the way before the deploy.

## Update the deploynaut database

The deploynaut needs to update its list of projects and environments anytime the environment files been added / removed. This is done by running the [Sync projects and environments](http://deploy.silverstripe.com/dev/tasks/SyncProjectsAndEnvironments) task.

# Configuring the project

Login to the deploynaut project administration view, [Deploynaut Projects](http://deploy.silverstripe.com/admin/naut/DNProject) and edit the relevant project.

Edit the git uri to the project in the `CVSPath` field, i.e: `ssh://git@gitorious.silverstripe.com:2222/project/project.git`

Add users that are allowed to see this project on the projects list. You will also need to add users to individual environments that can deploy it.



