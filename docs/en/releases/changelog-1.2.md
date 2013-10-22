# Changelog 1.2

## Added features

- Admin users can create and delete projects via the web UI.
- Admin users can modify the capistrano environment configuration via the web UI

## Upgrade migration

Run the migration script:

	./framework/sake dev/tasks/DNMigrate1_1to1_2

This will convert the DNEnvironment.Filename from "/full/absolute/path/environment.rb" 
to "environment.rb"

## Fixes

### SyncProjectsAndEnvironments

This tasks syncronizes the database entries with the capistrano environment files.

The task now by defaults runs in dryrun mode and tries to predict what changes will be 
saved to the database.

	./framework/sake dev/tasks/SyncProjectsAndEnvironments

To execute the sync script, run the following:

	./framework/sake dev/tasks/SyncProjectsAndEnvironments dryrun=0