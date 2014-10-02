# Pipelines

## Introduction

Pipelines will be used to break down various processes within Deploynaut into individual steps, that are run one after
the other in a pipeline. This is modelled by the `Pipeline` and `PipelineStep` classes.

A Pipeline is associated with a DNEnvironment, and each environment can contain many pipelines, which contains the
history of various action within Deploynaut. Each Pipeline then has a set of ordered steps, which are defined
separately for each environment in a YAML file, and these are executed in order when a pipeline starts.

## Setting up CheckPipelineStatus daemon

The `CheckPipelineStatus` command should be run continuously to ensure that pipeline requests proceed as quickly as they
can. This can be installed as a daemon process.

### Debian Linux

	sudo cp /sites/deploynaut/www/deploynaut/.scripts/pipecheck-initd /etc/init.d/pipecheck
	sudo chown root:root /etc/init.d/pipecheck
	sudo update-rc.d pipecheck defaults

Once this is in place, you can run the pipeline checker like this:

	sudo /etc/init.d/pipecheck start
	sudo /etc/init.d/pipecheck status

The pipeline checker can be stopped with the `stop` command:

	sudo /etc/init.d/pipecheck stop
	sudo /etc/init.d/pipecheck status

### OS X

	sudo cp /sites/deploynaut/www/deploynaut/.scripts/deploynaut.pipecheck.plist /Library/LaunchDaemons/deploynaut.pipecheck.plist
	sudo launchctl load /Library/LaunchDaemons/deploynaut.pipecheck.plist

Note: The provided scripts have a webroot hardcoded to `/sites/deploynaut/www`. Please change that if you have
installed Deploynaut into a different location.

## How it works

When a deploy is initiated and there is a configured YAML for that environment, `Pipeline::start()` is called, which
takes the configured YAML file for the given environment and sets up the configured steps from that configuration.

Each step is defined as a subclass of `PipelineStep`, and each step class should contain a `start()` and a `finish()`
method. `start()` should set up the step for processing, at a minimum set `$this->Status = 'Started'`. When a step
finishes, it should call `finish()` so the step is marked as completed.

## YML file configuration

Pipelines are created by editing YML files to define the steps and their execution order, as well as various
configuration settings.

YAML files are configured in the Deploynaut admin interface under a specific project's environment in the
"Pipeline Template" tab while editing that environment..

This simple example checks that the site is accessible after a deployment has completed.

``yml
PipelineConfig:
  DependsOnProject: myproject
  Description: >
    Subsequent deployments to this environment that pass the smoke test will be eligible
    for deployment to the live instance.
  ServiceArguments:
    from: somewhere@mysite.com
    reply-to: somewhere@mysite.com
  # Global smoketests used both by the forward and rollback deployments
  Tests:
    Home:
      URL: http://mysite.com/
      ExpectStatus: 200
    Admin:
      URL: http://mysite.com/admin
      ExpectStatus: 302
Steps:
  # Deploy the given code
  Deployment:
    Class: DeploymentPipelineStep
    MaxDuration: 3600
  # Test that the deployment works. Uses the Pipeline.Tests config above.
  SmokeTest:
    Class: SmokeTestPipelineStep
``

The `Config.DependsOnEnvironment` variable is how steps like the SmokeTestPipelineTest know which environment to perform
their checks on.

Note: All config files inherit from https://github.com/silverstripe/deploynaut/blob/master/_config/pipeline.yml

## Testing

When setup on a server, a dry-run of a complete pipeline can be initiated by a user with the appropriate permission,
(or logged in as admin). To enable dry-running of pipelines for any environment, edit the environment in the CMS,
and check the "Enable dry run?" option under the "Pipeline Settings" tab.

This will enable a new deployment option on the front end, with the label "Dry-run release process".

This process differs from the normal pipeline execution in the following ways:

* Messages are not sent to users
* Capistrano commands will not execute
* Deployments or snapshots will not be initiated

Whenever an action would normally be taken, the subsequent log message will be prefixed with "[Skipped]" to denote
an action skipped by the dry-run.

These actions are taken as per normal:

* Smoke tests
* User front-end actions
* Logging
