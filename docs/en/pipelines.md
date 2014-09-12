# Introduction
See docs/en/index.md for an overview of the Pipelining system.

# Running the CheckPipelineStatus command
The CheckPipelineStatus command should be run continuously to ensure that pipeline requests proceed as quickly as they
can. This is currently achieved using a daemon process, installed at /etc/init.d/pipecheck. The code for this can be
found in /path/to/webroot/deploynaut/.scripts/pipecheck-initd. It should be renamed to /etc/init.d/pipecheck to load.

Note: For OSX you can use the copy the pipecheck-plist template into /Library/LaunchDaemons/deploynaut.pipecheck.plist
and initialise it with "sudo launchctl load /Library/LaunchDaemons/deploynaut.pipecheck.plist"

Prior to installing, you'll want to double-check the webroots in both script files. It currently assumes that the
webroot is /sites/deploynaut/www, and therefore that the pipecheck script that loops forever is at
/sites/deploynaut/www/deploynaut/.scripts/pipecheck. Both scripts need to be modified slightly (in the config sections
only) if that's not the case.

Once this is in place, you can run the pipeline
checker like this:
	$> sudo /etc/init.d/pipecheck start
	$> sudo /etc/init.d/pipecheck status

The pipeline checker can be stopped with the `stop` command:
	$> sudo /etc/init.d/pipecheck stop
	$> sudo /etc/init.d/pipecheck status

# A typical request would be something like:
    1. Pipeline created based on a .yml file (see below).
    2. Pipeline::start() called, which in turn:
        1. Sets up all steps that need to be created for this pipeline, based on the .yml file
        2. Sets $this->Status = 'Running' (on the Pipeline object).
    3. Each PipelineStep should have a start() and finish() method, and asynchronous steps should have a process()
       method.
        1. start() should set up the step for processing (e.g. at a minimum, set $this->Status = 'Started').
            a. For synchronous steps, the start() method will perform the actual step required.
            b. For asynchronous steps, the start() method should create a job, enqueue it using Resque::enqueue() and
               call the 'perform()' method on the `PipelineStep` object.
        2. The finish() method will either be called by start() for synchronous steps, or perform() by asynchronous
           steps.
    4. When a Pipeline Step completes, it will be picked up by the CheckPipelineStatus controller. This controller is
       run via the command-line (either via cron, a daemon, or by continually enqueueing itself into php-resque - yet
       to be determined how this works. Whenever the controller runs, it will:
        1. Check to ensure it's being run from the command line.
        2. Find all Pipeline objects with a Status of 'Running', it will call `Pipeline::checkPipelineStatus()`, which:
            1. If the pipeline's current step is marked as 'Finished', and the next step is not 'Started', then start
               that next step.
            2. If the current step is marked as 'Finished', and there are no more steps, then update the Pipeline to
               mark it as completed.
            3. If the current step is marked as 'Failed' and the pipeline is not also marked as 'Failed', then leave a
               warning message in the logs, and mark the pipeline as 'Failed' too.

# YML file configuration
Pipelines are created by editing YML files to define the steps and their execution order, as well as various
configuration settings. A few sample YML files are below. These currently rely on the environment names being
unchanged, which isn't ideal and would be good to tidy up.

The Config.DependsOnEnvironment variable is how steps like the SmokeTestPipelineTest know which environment to perform
their checks on.

```yml
## Live site (project1-live.yml)
PipelineConfig:
	OnSuccessNotify: <instance-manager>,<requester>,ops@silverstripe.com
	OnFailureNotify: <instance-manager>,<requester>,ops@silverstripe.com
	DependsOnProject: "project1"
	DependsOnEnvironment: "uat"
	FilteredCommits: "DNFinishedCommits"
Steps:
	SmokeTestPipelineStepBefore:
		Class: SmokeTestPipelineStep
		PerformTestOn: 'DependentEnvironment'
	TxtConfirmationPipelineStep:
		Class: TxtConfirmationPipelineStep
		Recipients: <instance-manager>,<requester>,021971373,mattpeel@silverstripe.com
	ShowMaintenancePipelineStep:
		Class: ShowMaintenancePipelineStep
	DeploymentPipelineStep:
		Class: DeploymentPipelineStep
	SmokeTestPipelineStepAfter:
		Class: SmokeTestPipelineStep
		PerformTestOn: 'ThisEnvironment'
	HideMaintenancePipelineStep:
		Class: HideMaintenancePipelineStep
    

## UAT Site (project1-uat.yml)
PipelineConfig:
	OnSuccessNotify: <instance-manager>,<requester>,ops@silverstripe.com
	OnFailureNotify: <instance-manager>,<requester>,ops@silverstripe.com
	DependsOnProject: "project1"
	DependsOnEnvironment: "dev"
Steps:
	SmokeTestPipelineStepBefore:
		Class: SmokeTestPipelineStep
		PerformTestOn: 'DependentEnvironment'
	ShowMaintenancePipelineStep:
		Class: ShowMaintenancePipelineStep
	DeploymentPipelineStep:
		Class: DeploymentPipelineStep
	SmokeTestPipelineStepAfter:
		Class: SmokeTestPipelineStep
		PerformTestOn: 'ThisEnvironment'
	HideMaintenancePipelineStep:
		Class: HideMaintenancePipelineStep


## Dev site (project1-dev.yml)
PipelineConfig:
	OnSuccessNotify: <instance-manager>,<requester>,ops@silverstripe.com
	OnFailureNotify: <instance-manager>,<requester>,ops@silverstripe.com
	# Note: No DependsOnEnvironment set, meaning that there are no barriers to deployment.
	# For example, you can't run a SmokeTestPipelineStep with a 'PerformTestOn' of 'DependentEnvironment' as there is
	# none to test it on.
Steps:
	ShowMaintenancePipelineStep:
		Class: ShowMaintenancePipelineStep
	DeploymentPipelineStep:
		Class: DeploymentPipelineStep
	SmokeTestPipelineStepAfter:
		Class: SmokeTestPipelineStep
		PerformTestOn: 'ThisEnvironment'
	HideMaintenancePipelineStep:
		Class: HideMaintenancePipelineStep
```