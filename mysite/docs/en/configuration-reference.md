# Configuration reference

## Per-environment configuration files

The environment config files are placed under `../deploynaut-resources/envs`, in the project-specific direcories. One project can have multiple environments - Deploynaut distunguishes between them by file names.

## Environment configuration variables

* `application`: used internally by capistrano gem.
* `deploy_to`: the path under which the `www` folder lives (one level above webroot)
* `webserver_group`: the group the webserver runs on
* `webserver_user`: the webserver user, will be used to run dev/build. Leave as "" to prevent sudo.
* `ssh_options[:port]`: port number for the SSH connection
* `ssh_options[:username]`: username for the SSH connection
* `ssh_options[:keys]`: key path to use for the SSH connection
* `web`: the URL of the server
* `db`: the URL of the DB server
