<?php

/**
 * Class Pipeline
 * A Pipeline represents one action (e.g. 'Deploy'), separated out into multiple {@link PipelineStep} objects. A
 * Pipeline acts on a single Git SHA, and processes that SHA through multiple steps (e.g. smoketesting it, loading a
 * maintenance page up, deploying the SHA, smoketesting the site after deploy, removing the maintenance page.
 *
 * Pipeline defines a series of "Steps" through the YML configuration for the "regular" execution, but it also hardcodes
 * rollback steps separately. These are handled in a special way if the "regular" steps fail. See beginRollback below.
 * The rollback step progression is handled by checkPipelineStatus as normal though.
 *
 * If the regular steps fail, they must notify the pipeline via markFailed. This will either fail the pipeline or put it
 * in the "Rollback" state (this appends the rollback steps to the end of the step list automatically). These extra
 * steps are in fact no different to regular steps - they must succeed and fail in the standard way.
 *
 * Regardless of the rollback outcome, the processing will always end up in finaliseRollback - either via step calling
 * markFailed, or by checkPipelineStatus running out of steps to run. This concludes the pipeline.
 *
 * So to recap, the last functions that are called on Pipeline are:
 * - markComplete, if the pipeline has been successful (i.e. no rollback)
 * - markFailed, if a step has failed and there is no possibility of rollback.
 * - finaliseRollback, when rollback was executed, regardless whether it was successful or not.
 *
 * Here is an example configuration that utilises all options provided by this class:
 *
 * <code>
 * PipelineConfig:
 *   DependsOnProject: "ss3"
 *   DependsOnEnvironment: "deploytest"
 *   FilteredCommits: "DNFinishedCommits"
 *   Description: >
 *     In order to deploy to this environment instance manager confirmation is required.<br />
 *     Only successful deployments to the test server are permitted to be selected.
 *   # Contacts to notify, as well as the author of this pipeline
 *   Tests: # Smoke tests used by both rollback and smoke test
 *     Home:
 *       URL: http://www.mysite.com/
 *       ExpectStatus: 200
 *     Videos:
 *       URL: http://www.mysite.com/videos/
 *       ExpectStatus: 200
 *   Recipients:
 *     Success:
 *       - success@silverstripe.com
 *     Failure:
 *       - errors@silverstripe.com
 *     Abort:
 *       - abort@silverstripe.com
 *     RollbackStarted:
 *       - ops@silverstripe.com
 *     RollbackSuccess:
 *       - ops@silverstripe.com
 *     RollbackFailure:
 *       - ops@silverstripe.com
 *   Messages:
 *     # Messages sent to all users (including <requester>)
 *     Success: 'Deployment for <project>/<environment> has successfully completed.'
 *     Failure: 'Deployment for <project>/<environment> has failed.'
 *     Abort: 'Deployment for <project>/<environment> has been aborted.'
 *     RollbackStarted: 'Deployment failed, rollback for <project>/<environment> has begun.'
 *     RollbackSuccess: 'Rollback for <project>/<environment> has successfully completed.'
 *     RollbackFailure: 'Rollback for <project>/<environment> has failed.'
 *   Subjects:
 *     # Subject line for all users
 *     Success: 'Deployment for <project>/<environment>: Success'
 *     Failure: 'Deployment for <project>/<environment>: Failure'
 *     Abort: 'Deployment for <project>/<environment>: Aborted'
 *     RollbackStarted: 'Deployment failed, rollback for <project>/<environment> has begun.'
 *     RollbackSuccess: 'Rollback for <project>/<environment> has successfully completed.'
 *     RollbackFailure: 'Rollback for <project>/<environment> has failed.'
 *   ServiceArguments:
 *     # Additional arguments that make sense to the ConfirmationMessagingService
 *     from: admin@silverstripe.com
 *     reply-to: noreply@silverstripe.com
 * RollbackStep1:
 *   Class: RollbackStep
 *   # ... first step to be performed conditionally (RollbackStep is expected here).
 * RollbackStep2:
 *   Class: SmokeTestPipelineStep
 *   # ... second step to be performed conditionally (SmokeTestPipelineStep is expected here).
 * Steps:
 *   ... named steps.
 * </code>
 *
 * @see docs/en/pipelines.md for further information
 *
 * @method DNEnvironment Environment()
 * @method Member Author()
 * @method PipelineStep CurrentStep()
 * @method DataList Steps()
 * @property string $Status
 * @property string $Config
 * @property string $SHA
 * @property bool $DryRun
 * @property string $LastMessageSent
 */
class Pipeline extends DataObject implements PipelineData {

	/**
	 * Messages
	 */
	const ALERT_ABORT = 'Abort';
	const ALERT_SUCCESS = 'Success';
	const ALERT_FAILURE = 'Failure';
	const ALERT_ROLLBACK_STARTED = 'RollbackStarted';
	const ALERT_ROLLBACK_SUCCESS = 'RollbackSuccess';
	const ALERT_ROLLBACK_FAILURE = 'RollbackFailure';

	/**
	 * @var array
	 * - Status: Current status of this Pipeline. Running means 'currently executing a {@link PipelineStep}'.
	 *           See the {@link PipelineControllerTask} class for why this is important.
	 * - SHA:    This is the Git SHA that the pipeline is acting on. This is passed into the {@link PipelineStep}
	 *           objects so that the steps know what to smoketest, deploy, etc.
	 */
	private static $db = array(
		'Status' => 'Enum("Running,Complete,Failed,Aborted,Rollback,Queued","Queued")',
		'Config' => 'Text', // serialized array of configuration for this pipeline
		'SHA' => 'Varchar(255)',
		'DryRun' => 'Boolean', // Try if this deployment is a test dryrun
		'LastMessageSent' => 'Varchar(255)' // ID of last message sent
	);

	/**
	 * @var array
	 * - Author:      The {@link Member} object that started this pipeline running.
	 * - Environment: The {@link DNEnvironment} that this Pipeline is associated to.
	 * - CurrentStep: The current {@link PipelineStep} object that is keeping this pipeline alive. This should be
	 *                cleared when the last step is complete.
	 */
	private static $has_one = array(
		'Author' => 'Member',
		'Environment' => 'DNEnvironment',
		'CurrentStep' => 'PipelineStep',
		// to be used for rollbacks
		"PreviousSnapshot" => "DNDataTransfer",
		"PreviousDeployment" => 'DNDeployment',
		"CurrentDeployment" => "DNDeployment",
		"RollbackStep1" => "PipelineStep",
		"RollbackStep2" => "PipelineStep"
	);

	/**
	 * @var array
	 * - Steps: These are ordered by the `PipelineStep`.`Order` attribute.
	 */
	private static $has_many = array(
		'Steps' => 'PipelineStep'
	);

	private static $summary_fields = array(
		'ID' => 'ID',
		'Status' => 'Status',
		'SHA' => 'SHA',
		'Author.Title' => 'Author',
		'CurrentStep.Name' => 'Current Step',
		'Created' => 'Created',
		'LastEdited' => 'Last Updated'
	);

	private static $default_sort = '"Created" DESC';

	private static $cast = array(
		'RunningDescription' => 'HTMLText'
	);

	/**
	 * @config
	 * @var array
	 */
	private static $dependencies = array(
		'MessagingService' => '%$ConfirmationMessagingService'
	);

	/**
	 * Currently assigned messaging service
	 *
	 * @var ConfirmationMessagingService
	 */
	private $messagingService = null;

	/**
	 * @param ConfirmationMessagingService $service
	 */
	public function setMessagingService(ConfirmationMessagingService $service) {
		$this->messagingService = $service;
	}

	/**
	 * @return ConfirmationMessagingService
	 */
	public function getMessagingService() {
		return $this->messagingService;
	}

	public function __isset($property) {
		// Workaround fixed in https://github.com/silverstripe/silverstripe-framework/pull/3201
		// Remove this once we update to a version of framework which supports this
		if($property === 'MessagingService') return !empty($this->messagingService);
		return parent::__isset($property);
	}

	/**
	 * Retrieve message template replacements
	 *
	 * @return array
	 */
	public function getReplacements() {
		// Get member who began this request
		$author = $this->Author();
		$environment = $this->Environment();
		return array(
			'<abortlink>' => Director::absoluteURL($this->Environment()->Link()),
			'<pipelinelink>' => Director::absoluteURL($this->Link()),
			'<requester>' => $author->Title,
			'<requester-email>' => $author->Email,
			'<environment>' => $environment->Name,
			'<project>' => $environment->Project()->Name,
			'<commitsha>' => $this->SHA
		);
	}

	/**
	 * Title of this step
	 *
	 * @return string
	 */
	public function getTitle() {
		return "Pipeline {$this->ID} (Status: {$this->Status})";
	}

	public function canAbort($member = null) {
		// Owner can abort
		$member = $member ?: Member::currentUser();
		if(!$member) return false;
		if($member->ID == $this->AuthorID) return true;

		// Check environment permission
		return $this->Environment()->canAbort($member);
	}

	/**
	 * Get status of currently running step
	 *
	 * @return string Status description (html format)
	 */
	public function getRunningDescription() {
		if(!$this->isActive()) {
			return 'This pipeline is not currently running';
		}
		$result = '';
		if($step = $this->CurrentStep()) {
			$result = $step->getRunningDescription();
		}
		return $result ?: 'This pipeline is currently running';
	}

	/**
	 * Get options for the currently running pipeline, if and only if it is currently running
	 *
	 * @return ArrayList List of items with a Link and Title attribute
	 */
	public function RunningOptions() {
		if(!$this->isActive()) return null;
		$actions = array();

		// Let current step update the current list of options
		if(($step = $this->CurrentStep()) && ($step->isRunning())) {
			$actions = $step->allowedActions();
		}
		return new ArrayList($actions);
	}

	/**
	 * Get possible logs for the currently pipeline
	 *
	 * @return ArrayList List of logs with a Link and Title attribute
	 */
	public function LogOptions() {
		if(!$this->isActive()) return null;
		$logs[] = array(
			'ButtonText' => 'Pipeline Log',
			'Link' => $this->Link()
		);

		if($this->PreviousSnapshotID > 0) {
			$logs[] = array(
				'ButtonText' => 'Snapshot Log',
				'Link' => $this->PreviousSnapshot()->Link()
			);
		}

		if($this->CurrentDeploymentID > 0) {
			$logs[] = array(
				'ButtonText' => 'Deployment Log',
				'Link' => $this->CurrentDeployment()->Link()
			);
		}

		// Get logs from rollback steps (only for RollbackSteps).
		$rollbackSteps = array($this->RollbackStep1(), $this->RollbackStep2());
		foreach ($rollbackSteps as $rollback) {
			if($rollback->exists() && $rollback->ClassName=='RollbackStep') {
				if($rollback->RollbackDeploymentID > 0) {
					$logs[] = array(
						'ButtonText' => 'Rollback Log',
						'Link' => $rollback->RollbackDeployment()->Link()
					);
				}

				if($rollback->RollbackDatabaseID > 0) {
					$logs[] = array(
						'ButtonText' => 'Rollback DB Log',
						'Link' => $rollback->RollbackDatabase()->Link()
					);
				}
			}
		}

		return new ArrayList($logs);
	}

	/**
	 * Cached of config merged with defaults
	 *
	 * @var array
	 */
	protected $mergedConfig;

	/**
	 * Get this pipeline configuration. If the configuration has been serialized
	 * and saved into the Config field, it'll use that. If that field is empty,
	 * it'll read the YAML file directly and return that instead.
	 *
	 * @return array
	 */
	public function getConfigData() {
		// Lazy load if necessary
		$data = null;
		if(!$this->Config && ($data = $this->Environment()->loadPipelineConfig())) {
			$this->Config = serialize($data);
		}

		// Merge with defaults
		if($this->Config) {
			if(!$this->mergedConfig) {
				$this->mergedConfig = $data ?: unserialize($this->Config);
				if($default = self::config()->default_config) {
					Config::merge_array_low_into_high($this->mergedConfig, $default);
				}
			}
			return $this->mergedConfig;
		}

		// Fail if no data available
		$path = $this->Environment()->getPipelineFilename();
		throw new Exception(sprintf('YAML configuration for pipeline not found at path "%s"', $path));
	}

	public function setConfig($data) {
		$this->mergedConfig = null;
		return parent::setField('Config', $data);
	}

	/**
	 * Retrieve the value of a specific config setting
	 *
	 * @param string $setting Settings
	 * @param string $setting,... Sub-settings
	 * @return mixed Value of setting, or null if not set
	 */
	public function getConfigSetting($setting) {
		$source = $this->getConfigData();
		foreach(func_get_args() as $setting) {
			if(empty($source[$setting])) return null;
			$source = $source[$setting];
		}
		return $source;
	}


	public function getCMSFields() {
		$fields = new FieldList(new TabSet('Root'));

		// Main fields
		$fields->addFieldsToTab('Root.Main', array(
			TextField::create('SHA')
				->setDescription('SHA of the commit this pipeline is running against')
				->performReadonlyTransformation(),
			TextField::create('AuthorName', 'Author', ($author = $this->Author()) ? $author->Title : null)
				->setDescription('Person who initiated this pipeline')
				->performReadonlyTransformation(),
			DropdownField::create('Status', 'Status', $this->dbObject('Status')->enumValues()),
			DropdownField::create('CurrentStepID', 'Current Step', $this->Steps()->map('ID', 'TreeTitle')),
			TextField::create(
				'CurrentDeployment_Label',
				'Current Deployment',
				$this->CurrentDeployment()->getTitle()
			)	->setDescription('Deployment generated by this pipeline')
				->performReadonlyTransformation(),
		));

		// Backup fields
		$fields->addFieldsToTab('Root.Backups', array(
			TextField::create(
				'PreviousDeployment_Label',
				'Previous Deployment',
				$this->PreviousDeployment()->getTitle()
			)	->setDescription('Prior deployment to revert to if this pipeline fails')
				->performReadonlyTransformation(),
			TextField::create(
				'PreviousSnapshot_Label',
				'Previous DB Snapshot',
				$this->PreviousSnapshot()->getTitle()
			)	->setDescription('Database backup to revert to if this pipeline fails')
				->performReadonlyTransformation()
		));

		if($log = $this->LogContent()) {
			$fields->addFieldToTab(
				'Root.Main',
				ToggleCompositeField::create(
					'PipelineLog',
					'Pipeline Log',
					LiteralField::create('LogText', nl2br(Convert::raw2xml($log)))
				)
			);
		}

		// Steps
		$stepConfig = GridFieldConfig_RecordEditor::create();
		$steps = GridField::create('Steps', 'Pipeline Steps', $this->Steps(), $stepConfig);
		$fields->addFieldsToTab('Root.PipelineSteps', $steps);

		return $fields;
	}

	/**
	 * Return a dependent {@link DNEnvironment} based on this pipeline's dependent environment configuration.
	 * @return DNEnvironment
	 */
	public function getDependentEnvironment() {
		// dependent environment not available
		$projectName = $this->getConfigSetting('PipelineConfig', 'DependsOnProject');
		$environmentName = $this->getConfigSetting('PipelineConfig', 'DependsOnEnvironment');
		if(empty($projectName) || empty($environmentName)) {
			return null;
		}

		$project = DNProject::get()->filter('Name', $projectName)->first();
		if(!($project && $project->exists())) {
			throw new Exception(sprintf('Could not find dependent project "%s"', $projectName));
		}

		$environment = DNEnvironment::get()->filter(array(
			'ProjectID' => $project->ID,
			'Name' => $environmentName
		))->first();

		if(!($environment && $environment->exists())) {
			throw new Exception(sprintf(
				'Could not find dependent environment "%s" in project "%s"',
				$environmentName,
				$projectName
			));
		}

		return $environment;
	}

	/**
	 * Generate a step from a name, config, and sort order
	 *
	 * @param string $name
	 * @param array $stepConfig
	 * @param int $order
	 * @return PipelineStep
	 * @throws Exception
	 */
	protected function generateStep($name, $stepConfig, $order = 0) {
		$stepClass = isset($stepConfig['Class']) ? $stepConfig['Class'] : $stepConfig;

		if(empty($stepClass)) {
			throw new Exception(
				sprintf('Missing or empty Class specifier for step "%s"', $name)
			);
		}

		if(!is_subclass_of($stepClass, 'PipelineStep')) {
			throw new Exception(
				sprintf('%s is not a valid "Class" field name for step "%s"', var_export($stepClass, true), $name)
			);
		}

		$step = $stepClass::create();
		$step->Name = $name;
		$step->PipelineID = $this->ID;
		$step->Order = $order;
		$step->Status = 'Queued';
		$step->Config = serialize($stepConfig);
		$step->write();
		return $step;
	}

	/**
	 * Starts the pipeline process.
	 *
	 * Reads a YAML configuration from the linked {@link DNEnvironment}
	 * and builds the {@link PipelineStep} objects and runs them.
	 *
	 * Note that this method doesn't actually start any {@link PipelineStep} objects, that is handled by
	 * {@link self::checkPipelineStatus()}, and the daemon running the process.
	 */
	public function start() {
		// Ensure there are no other running {@link Pipeline} objects for this {@link DNEnvironment}
		// Requires that $this->EnvironmentID has been set
		$env = $this->Environment();
		if(!($env && $env->exists())) {
			throw new LogicException("This pipeline needs a valid environment to run on.");
		}

		if($env->HasCurrentPipeline()) {
			throw new LogicException("You can only run one pipeline at a time on this environment.");
		}

		$this->write(); // ensure we've written this record first

		// Instantiate steps.
		foreach($this->getConfigSetting('Steps') as $name => $stepConfig) {
			$this->pushPipelineStep($name, $stepConfig);
		}

		$this->Status = 'Running';
		$this->write();

		$this->log('Started logging for this pipeline!');

		return true;
	}

	/**
	 * Mark this Pipeline as completed.
	 *
	 * @return void
	 */
	public function markComplete() {
		$this->Status = "Complete";
		$this->log("Pipeline completed successfully.");
		$this->write();
		// Some steps may pre-emptively send a success message before the pipeline itself has completed
		if($this->LastMessageSent !== self::ALERT_SUCCESS) {
			$this->sendMessage(self::ALERT_SUCCESS);
		}
	}

	/**
	 * @return bool true if this Pipeline has successfully completed all {@link PipelineStep} steps already.
	 */
	public function isComplete() {
		return $this->Status == "Complete";
	}

	/**
	 * True if the pipeline is running but NOT doing a rollback
	 *
	 * @return bool
	 */
	public function isRunning() {
		return $this->Status == "Running";
	}

	/**
	 * True if the pipeline is running or doing a rollback
	 *
	 * @return bool
	 */
	public function isActive() {
		return $this->isRunning() || $this->isRollback();
	}

	/**
	 * Push a step to the end of a pipeline
	 */
	private function pushPipelineStep($name, $stepConfig) {
		$lastStep = $this->Steps()->sort("Order DESC")->first();
		$order = $lastStep ? $lastStep->Order + 1 : 1;
		return $this->generateStep($name, $stepConfig, $order);
	}

	/**
	 * The rollback has finished - close the pipeline and send relevant messages.
	 */
	protected function finaliseRollback() {

		// Figure out the status by inspecting specific rollback steps.
		$success = true;
		$rollback1 = $this->RollbackStep1();
		$rollback2 = $this->RollbackStep2();
		if (!empty($rollback1) && $rollback1->Status=='Failed') $success = false;
		if (!empty($rollback2) && $rollback2->Status=='Failed') $success = false;

		// Send messages.
		if ($success) {
			$this->log("Pipeline failed, but rollback completed successfully.");
			$this->sendMessage(self::ALERT_ROLLBACK_SUCCESS);
		} else {
			$this->log("Pipeline failed, rollback failed.");
			$this->sendMessage(self::ALERT_ROLLBACK_FAILURE);
		}

		// Finish off the pipeline - rollback will only be triggered on a failed pipeline.
		$this->Status = 'Failed';
		$this->write();

	}

	/**
	 * Initiate a rollback. Moves the pipeline to the 'Rollback' status.
	 */
	protected function beginRollback() {
		$this->log("Beginning rollback...");
		$this->sendMessage(self::ALERT_ROLLBACK_STARTED);

		// Add rollback step.
		$configRollback1 = $this->getConfigSetting('RollbackStep1');
		$stepRollback1 = $this->pushPipelineStep('RollbackStep1', $configRollback1);
		$this->RollbackStep1ID = $stepRollback1->ID;
		$this->CurrentStepID = $stepRollback1->ID;
		$this->Status = 'Rollback';

		// Add smoke test step, if available, for later processing.
		$configRollback2 = $this->getConfigSetting('RollbackStep2');
		if ($configRollback2) {
			$stepRollback2 = $this->pushPipelineStep('RollbackStep2', $configRollback2);
			$this->RollbackStep2ID = $stepRollback2->ID;
		}

		$this->write();

		$stepRollback1->start();
	}

	/**
	 * Check if pipeline currently permits a rollback.
	 * This could be influenced by both the current state and by the specific configuration.
	 */
	protected function canStartRollback() {
		// The rollback cannot run twice.
		if ($this->isRollback()) return false;

		// Rollbacks must be configured.
		if (!$this->getConfigSetting('RollbackStep1')) return false;

		// On dryrun let rollback run
		if($this->DryRun) return true;

		// Pipeline must have ran a deployment to be able to rollback.
		$deploy = $this->CurrentDeployment();
		$previous = $this->PreviousDeployment();
		if (!$deploy->exists() || !$previous->exists()) return false;

		return true;
	}

	/**
	 * Notify Pipeline that a step has failed and failure processing should kick in. If rollback steps are present
	 * the pipeline will be put into 'Rollback' state. After rollback is complete, regardless of the rollback result,
	 * the pipeline will be failed.
	 *
	 * @param bool $notify Set to false to disable notifications for this failure
	 */
	public function markFailed($notify = true) {
		// Abort all running or queued steps.
		$steps = $this->Steps();
		foreach($steps as $step) {
			if ($step->isQueued() || $step->isRunning()) $step->abort();
		}

		if($this->canStartRollback()) {
			$this->beginRollback();
		} else if ($this->isRollback()) {
			$this->finaliseRollback();
		} else {
			// Not able to roll back - fail immediately.
			$this->Status = 'Failed';
			$this->log("Pipeline failed, not running rollback (not configured or not applicable yet).");
			$this->write();
			if($notify) $this->sendMessage(self::ALERT_FAILURE);
		}
	}

	/**
	 * @return bool true if this Pipeline failed to execute all {@link PipelineStep} steps successfully
	 */
	public function isFailed() {
		return $this->Status == "Failed";
	}

	/**
	 * @return bool true if this Pipeline is rolling back.
	 */
	public function isRollback() {
		return $this->Status == "Rollback";
	}

	/**
	 * Mark this Pipeline as aborted
	 *
	 * @return void
	 */
	public function markAborted() {
		$this->Status = 'Aborted';
		$logMessage = sprintf(
			"Pipeline processing aborted. %s (%s) aborted the pipeline",
			Member::currentUser()->Name,
			Member::currentUser()->Email
		);
		$this->log($logMessage);
		$this->write();

		// Abort all running or queued steps.
		$steps = $this->Steps();
		foreach($steps as $step) {
			if ($step->isQueued() || $step->isRunning()) $step->abort();
		}

		// Send notification to users about this event
		$this->sendMessage(self::ALERT_ABORT);
	}

	/**
	 * Finds a message template for a given role and message
	 *
	 * @param string $messageID Message ID
	 * @return array Resulting array(subject, message)
	 */
	protected function generateMessageTemplate($messageID) {
		$subject = $this->getConfigSetting('PipelineConfig', 'Subjects', $messageID);
		$message = $this->getConfigSetting('PipelineConfig', 'Messages',  $messageID);
		$substitutions = $this->getReplacements();
		return $this->injectMessageReplacements($message, $subject, $substitutions);
	}

	/**
	 * Substitute templated variables into the given message and subject
	 *
	 * @param string $message
	 * @param string $subject
	 * @param array $substitutions
	 * @return array Resulting array(subject, message)
	 */
	public function injectMessageReplacements($message, $subject, $substitutions) {
		// Handle empty messages
		if(empty($subject) && empty($message)) return array(null, null);

		// Check if there's a role specific message
		$subjectText = str_replace(
			array_keys($substitutions),
			array_values($substitutions),
			$subject ?: $message
		);
		$messageText = str_replace(
			array_keys($substitutions),
			array_values($substitutions),
			$message ?: $subject
		);
		return array($subjectText, $messageText);
	}

	/**
	 * Sends a specific message to all marked recipients, including the author of this pipeline
	 *
	 * @param string $messageID Message ID. One of 'Abort', 'Success', or 'Failure', or some custom message
	 * @return boolean True if successful
	 */
	public function sendMessage($messageID) {
		// Check message, subject, and additional arguments to include
		list($subject, $message) = $this->generateMessageTemplate($messageID);
		if(empty($subject) || empty($message)) {
			$this->log("Skipping sending message. None configured for $messageID");
			return true;
		}

		// Save last sent message
		$this->LastMessageSent = $messageID;
		$this->write();

		// Setup messaging arguments
		$arguments = array_merge(
			$this->getConfigSetting('PipelineConfig', 'ServiceArguments') ?: array(),
			array('subject' => $subject)
		);

		// Send message to author
		if($author = $this->Author()) {
			$this->log("Pipeline sending $messageID message to {$author->Email}");
			$this->messagingService->sendMessage($this, $message, $author, $arguments);
		} else {
			$this->log("Skipping sending message to missing author");
		}

		// Get additional recipients
		$recipients = $this->getConfigSetting('PipelineConfig', 'Recipients', $messageID);
		if(empty($recipients)) {
			$this->log("Skipping sending message to empty recipients");
		} else {
			$recipientsStr = is_array($recipients) ? implode(',', $recipients) : $recipients;
			$this->log("Pipeline sending $messageID message to $recipientsStr");
			$this->messagingService->sendMessage($this, $message, $recipients, $arguments);
		}
	}

	/**
	 * @return bool true if this Pipeline has been aborted
	 */
	public function isAborted() {
		return $this->Status === "Aborted";
	}

	/**
	 * This method should be called only by the {@link CheckPipelineStatus} controller. It iterates through all the
	 * {@link PipelineStep} objects associated with this Pipeline, and finds a place where the pipeline has stalled
	 * (where one step has completed, but the next one has yet to start). It will then start the next step if required.
	 *
	 * We check here whether the {@link PipelineStep} finished successfully, and will mark the Pipeline as Failed if
	 * the step failed, but this is only a fallback, and should not be relied upon. The individual {@link PipelineStep}
	 * should mark itself as failed and then call {@link Pipeline::markFailed()} directly.
	 *
	 * If the Pipeline has run out of steps, then it will mark the pipeline as completed.
	 */
	public function checkPipelineStatus() {
		$message = "";

		if(!$this->isActive()) {
			$message = "Pipeline::checkPipelineStatus() should only be called on running or rolling back pipelines.";
		}

		if(!$this->ID || !$this->isInDB()) {
			$message = "Pipeline::checkPipelineStatus() can only be called on pipelines already saved.";
		}

		$currentStep = ($this->CurrentStep() && $this->CurrentStep()->isInDB())
			? $this->CurrentStep()
			: null;

		if($currentStep && $currentStep->PipelineID != $this->ID) {
			$message = sprintf(
				"The current step (#%d) has a pipeline ID (#%d) that doesn't match this pipeline's ID (#%d).",
				$currentStep->ID,
				$currentStep->PipelineID,
				$this->ID
			);
		}

		if($message) {
			$this->log($message);
			throw new LogicException($message);
		}

		// Fallback check only: this shouldn't be called unless a {@link PipelineStep} has been implemented incorrectly
		if($currentStep && $currentStep->isFailed() && !$this->isFailed() && !$this->isRollback()) {
			$this->log(sprintf("Marking pipeline step (#%d) as failed - this pipeline step needs to be amended to mark"
				. " the pipeline (as well as itself) as failed to ensure consistency.",
				$this->CurrentStep()->ID
			));

			$this->markFailed();
			return;
		}

		// If this is the first time the Pipeline is run, then we don't have a CurrentStep, so set it,
		// start it running, and return
		if(!$currentStep) {
			$step = $this->Steps()->first();
			$this->CurrentStepID = $step->ID;
			$this->write();

			$this->log("Starting first pipeline step...");
			$step->start();
		} else if($currentStep->isFinished()) {
			// Sort through the list of {@link PipelineStep} objects to find the next step we need to start.
			$this->log("Finding next step to execute...");
			$nextStep = $this->findNextStep();

			if(!$nextStep) {

				// Special handling, since the main pipeline has already failed at this stage.
				if ($this->isRollback()) {
					$this->finaliseRollback();
					return false;
				}

				// Double check for any steps that failed, but didn't notify the pipeline via markFailed.
				$failedSteps = PipelineStep::get()->filter(array(
					'PipelineID' => $this->ID,
					'Status' => 'Failed'
				))->count();
				if ($failedSteps) {
					$this->log('At least one of the steps has failed marking the pipeline as failed');
					$this->markFailed();
					return false;
				}

				// We've reached the end of this pipeline successfully!
				$this->markComplete();
				return;
			} else {
				$this->CurrentStepID = $nextStep->ID;
				$this->write();
				// Otherwise, kick off the next step
				$this->log(sprintf("Found the next step (#%s), starting it now...", $nextStep->Name));
				$nextStep->start();
			}
		// if the current step is failing run it again
		} else if($step = $this->CurrentStep()) {
			$step->start();
		}
	}

	/**
	 * Finds the next {@link PipelineStep} that needs to execute. Relies on $this->CurrentStep() being a valid step.
	 *
	 * @return PipelineStep|null The next step in the pipeline, or null if none remain.
	 */
	protected function findNextStep() {
		// otherwise get next step in chain
		$currentStep = $this->CurrentStep();
		return $this
			->Steps()
			->filter("Status", "Queued")
			->filter("Order:GreaterThanOrEqual", $currentStep->Order)
			->exclude("ID", $currentStep->ID)
			->sort("Order ASC")
			->first();
	}

	/**
	 * Finds the previous {@link PipelineStep} that executed. Relies on $this->CurrentStep() being a valid step.
	 *
	 * @return PipelineStep|null The previous step in the pipeline, or null if this is the first.
	 */
	public function findPreviousStep() {
		// otherwise get previous step in chain
		$currentStep = $this->CurrentStep();
		return $this
			->Steps()
			->filter("Status", "Finished")
			->filter("Order:LessThanOrEqual", $currentStep->Order)
			->exclude("ID", $currentStep->ID)
			->sort("Order DESC")
			->first();
	}

	/**
	 * Write to a common log file. This log file will be the same regardless of how often this pipeline is re-created
	 * from the database. To this end, it needs to know the database ID of this pipeline instance, so that it can
	 * generate the correct filename to open.
	 *
	 * This also includes the calling class and method name that called ->log() in the first place, so we can trace
	 * back where it was written from.
	 *
	 * @param string $message The message to log
	 * @throws LogicException Thrown if we can't log yet because we don't know what to log to (no db record yet).
	 * @return void
	 */
	public function log($message = "") {
		$log = $this->getLogger();

		// Taken from Debug::caller(), amended for our purposes to filter out the intermediate call to
		// PipelineStep->log(), so that our log message shows where the log message was actually created from.
		$bt = debug_backtrace();

		$index = ($bt[1]['class'] == 'PipelineStep') ? 2 : 1;

		$caller = $bt[$index];
		$caller['line'] = $bt[($index - 1)]['line']; // Overwrite line and file to be the the line/file that actually
		$caller['file'] = $bt[($index - 1)]['file']; // called the function, not where the function is defined.
		if(!isset($caller['class'])) $caller['class'] = ''; // In case it wasn't called from a class
		if(!isset($caller['type'])) $caller['type'] = ''; // In case it doesn't have a type (wasn't called from class)

		$log->write(sprintf("[%s::%s() (line %d)] %s", $caller['class'], $caller['function'], $caller['line'], $message));
	}

	/**
	 * Returns the {@link DeploynautLogFile} instance that will actually write to this log file.
	 *
	 * @return DeploynautLogFile
	 * @throws RuntimeException
	 */
	public function getLogger() {
		if(!$this->isInDB()) {
			throw new RuntimeException("Can't write to a log file until we know the database ID.");
		}

		if(!$this->Environment()) {
			throw new RuntimeException("Can't write to a log file until we have an Environment.");
		}

		if($this->Environment() && !$this->Environment()->Project()) {
			throw new RuntimeException("Can't write to a log file until we have the Environment's project.");
		}

		$environment = $this->Environment();
		$project = $this->Environment()->Project();
		$filename = sprintf('%s.pipeline.%d.log', $environment->getFullName('.'), $this->ID);

		return Injector::inst()->createWithArgs('DeploynautLogFile', array($filename));
	}

	public function getDryRun() {
		return $this->getField('DryRun');
	}

	public function Link($action = null) {
		return Controller::join_links($this->Environment()->Link(), 'pipeline', $this->ID, $action);
	}

	/**
	 * Link to an action on the current step
	 *
	 * @param string $action
	 * @return string
	 */
	public function StepLink($action = null) {
		return Controller::join_links($this->Link('step'), $action);
	}

	public function AbortLink() {
		return $this->Link('abort');
	}

	public function LogLink() {
		return $this->Link('log');
	}

	public function LogContent() {
		if($this->exists() && $this->Environment()) {
			$logger = $this->getLogger();
			if($logger->exists()) return $logger->content();
		}
	}

}
