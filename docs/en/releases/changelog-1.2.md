# Changelog 1.2

## Changes

- Admin users can create and delete projects via the web UI.
- Admin users can modify the capistrano environment configuration via the web UI
- Removed unused DNData::getBuildDir() and DNData::setBuildDir()

## Upgrade migration

### Config

If you have overriden the config/dnroot.yml, remove the first argument to DNData. The reason is 
that the current version of Deploynaut don't support deploys via tarballs.

So from:

	Injector:
	    DeploymentBackend:
	        class: CapistranoDeploymentBackend
	    DNData:
	        constructor:
				0: "../../deploynaut-resources/builds"
	            1: "../../deploynaut-resources/envs"
	            2: "../../deploynaut-resources/gitkeys""

To:

	Injector:
	    DeploymentBackend:
	        class: CapistranoDeploymentBackend
	    DNData:
	        constructor:
	            0: "../../deploynaut-resources/envs"
	            1: "../../deploynaut-resources/gitkeys"


To be able to edit the deployment recipies via the CMS UI, you will need to add this to 
your mysite/_config/config.yml

	DNEnvironment:
		allow_web_editing: true

### Migration script

Run the migration script:

	./framework/sake dev/tasks/DNMigrate1_1to1_2

This will convert the DNEnvironment.Filename from "/full/absolute/path/environment.rb" 
to "environment.rb"




## Other

### SyncProjectsAndEnvironments

This tasks syncronizes the database entries with the capistrano environment files.

The task now by defaults runs in dryrun mode and tries to predict what changes will be 
saved to the database.

	./framework/sake dev/tasks/SyncProjectsAndEnvironments

To execute the sync script, run the following:

	./framework/sake dev/tasks/SyncProjectsAndEnvironments dryrun=0