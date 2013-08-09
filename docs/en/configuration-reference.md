# Configuration reference

For Capistrano configuration reference refer to [Capistrano Wiki](https://github.com/capistrano/capistrano/wiki/2.x-Significant-Configuration-Variables).

## Per-environment configuration files

The environment config files are placed under `../deploynaut-resources/envs`, in the project-specific direcories. One project can have multiple environments - Deploynaut distunguishes between them by file names.

## Environment configuration variables

### Symbols

* `application`: used internally by capistrano gem.
* `deploy_to`: the path under which the `www` folder lives (one level above webroot)
* `webserver_group`: the group the webserver runs on
* `webserver_user`: the webserver user, will be used to run dev/build. Leave out to prevent sudo.
* `prevent_devbuild`: set to skip dev/build. Not recommended on actual live sites.
* `sake_path`: overrides the default sake path (framework/sake).
* `web`: the URL of the server
* `db`: the URL of the DB server

### Other variables

* `ssh_options[:port]`: port number for the SSH connection
* `ssh_options[:username]`: username for the SSH connection
* `ssh_options[:keys]`: key path to use for the SSH connection
