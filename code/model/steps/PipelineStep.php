<?php

/**
 * Represents a single step in a pipeline
 *
 * Caveat inheritors: apparently PipelineStep must call their respective Pipeline's markFailed() function upon failure.
 *
 * <code>
 * MyStep:
 *   Class: ClassOfStep
 *   NiceName: "Name of this step to display on frontend"
 *   NiceDone: "Name of this step to display on frontend once finished"
 * </code>
 *
 * @method Pipeline Pipeline()
 *
 * @package deploynaut
 * @subpackage pipeline
 */
class PipelineStep extends DataObject implements PipelineData {

	/**
	 * @var array
	 * - Order:  The order in which this step is to be executed within the {@link Pipeline}.
	 *           Links to the 'Pipeline' has_one below.
	 * - Status: The status if this particular step in the Pipeline. You can always query $this->Pipeline()->Status to
	 *           see the overall status of the pipeline itself.
	 */
	private static $db = array(
		'Name' => 'Varchar(255)',
		'Order' => 'Int',
		'Status' => 'Enum("Queued,Started,Finished,Failed,Aborted,n/a","n/a")',
		'Config' => 'Text' // serialized array of configuration for this step
	);

	private static $has_one = array(
		'Pipeline' => 'Pipeline'
	);

	/**
	 * @var string Ensure we use the 'Order' int as the sort order. This means that all code that references
	 * {@link Pipeline::PipelineSteps()} will always get the steps in the same order.
	 */
	private static $default_sort = 'Order';

	private static $summary_fields = array(
		'Name',
		'Status',
		'LastEdited'
	);
	
	/**
	 * Cached of config merged with defaults
	 *
	 * @var array
	 */
	protected $mergedConfig;

	/**
	 * Title of this step
	 *
	 * @return string
	 */
	public function getTitle() {
		return $this->Name ?: get_class($this);
	}

	public function getTreeTitle() {
		return $this->Title . ' (Status: ' . $this->Status . ')';
	}

	public function getNiceName() {
		$niceName = $this->getConfigSetting('NiceName')
			?: ucwords(trim(strtolower(preg_replace('/_?([A-Z])/', ' $1', $this->getTitle()))));
		
		if($this->isFinished()) {
			$niceName = $this->getConfigSetting('NiceDone') ?: $niceName;
		}

		return $niceName;
	}

	/**
	 * Unserializes a snippet of configuration that was saved at the time this step
	 * was created at {@link Pipeline::start()} so that this step can use that configuration
	 * to determine what it needs to do. e.g for SmokeTestPipelineStep this might contain
	 * a list of URLs that need to be checked and which status codes to check for.
	 *
	 * @return array
	 */
	public function getConfigData() {
		if(!$this->Config) return array();

		// Merge with defaults
		if(!$this->mergedConfig) {
			$this->mergedConfig = unserialize($this->Config);
			if($default = self::config()->default_config) {
				Config::merge_array_low_into_high($this->mergedConfig, $default);
			}
		}
		return $this->mergedConfig;
	}

	public function setConfig($data) {
		$this->mergedConfig = null;
		return parent::setField('Config', $data);
	}

	/**
	 * Describe what the step is currently doing.
	 *
	 * @return string
	 */
	public function getRunningDescription() {
		return '';
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

	public function finish() {
		$this->Status = 'Finished';
		$this->log('Step finished successfully!');
		$this->write();
	}

	/**
	 * Fail this pipeline step
	 *
	 * @param bool $notify Set to false to disable notifications for this failure
	 */
	public function markFailed($notify = true) {
		$this->Status = 'Failed';
		$this->log('Marking pipeline step as failed. See earlier log messages to determine cause.');
		$this->write();
		$this->Pipeline()->markFailed($notify);
	}

	/**
	 * Determine if this step is in progress (Started state).
	 *
	 * @return boolean
	 */
	public function isQueued() {
		return $this->Status === 'Queued';
	}

	/**
	 * Determine if this step is in progress (Started state).
	 *
	 * @return boolean
	 */
	public function isRunning() {
		return $this->Status === 'Started';
	}

	/**
	 * Determine if this step is in progress (Started state).
	 *
	 * @return boolean
	 */
	public function isFinished() {
		return $this->Status === "Finished";
	}

	/**
	 * Determine if the step has failed on its own (Failed state). No further state transitions may occur.
	 * If Pipeline determines the step to be failed, all subsequent states will be aborted.
	 *
	 * @return boolean
	 */
	public function isFailed() {
		return $this->Status === "Failed";
	}

	/**
	 * Determine if the step has been aborted (Aborted state).
	 *
	 * @return boolean
	 */
	public function isAborted() {
		return $this->Status === "Aborted";
	}

	/**
	 * Log a message to the current log
	 * 
	 * @param string $message
	 */
	public function log($message = "") {
		$this->Pipeline()->log($message);
	}

	/**
	 * Tries to look up the value of the 'PerformTestOn' yml key for this step, and return the {@link DNEnvironment}
	 * that the key refers to, if set.
	 *
	 * If the key isn't set, then it should return the current environment that the Pipeline is running for (e.g.
	 * $this->Pipeline()->Environment()).
	 *
	 * @return DNEnvironment The dependent {@link DNEnvironment}.
	 */
	protected function getDependentEnvironment() {
		if($this->getConfigSetting('PerformTestOn') === 'DependentEnvironment') {
			try {
				$environment = $this->Pipeline()->getDependentEnvironment();
			} catch(Exception $e) {
				$this->log($e->getMessage());
				$this->markFailed();
				return false;
			}
		} else {
			$environment = $this->Pipeline()->Environment();
		}

		return $environment;
	}

	/**
	 * Initialise the step unless it's already running (Started state).
	 * The step will be expected to transition from here to Finished, Failed or Aborted state.
	 *
	 * @return boolean True if successfully started, false if error
	 */
	public function start() {
		$this->Status = 'Started';
		$this->write();
	}

	/**
	 * Abort the step immediately, regardless of its current state, performing any cleanup necessary.
	 * If a step is aborted, all subsequent states will also be aborted by the Pipeline, so it is possible
	 * for a Queued step to skip straight to Aborted state.
	 *
	 * No further state transitions may occur. If aborting fails return false but remain in Aborted state.
	 *
	 * @return boolean True if successfully aborted, false if error
	 */
	public function abort() {

		if ($this->isQueued() || $this->isRunning()) {
			$this->Status = 'Aborted';
			$this->log('Step aborted');
			$this->write();
		}

		return true;
	}

	/**
	 * List of allowed actions the user is all allowed to take on this step
	 *
	 * @return array $options List of items, each as an associative array in the form
	 * array(
	 *     'action' => array(
	 *         'ButtonText' => 'Action Title',
	 *         'ButtonType' => 'btn-success',
	 *         'Link' => 'naut/project/ss3/environment/deployuat/pipeline/1/step/action',
	 *         'Title' => 'Action description',
	 *         'Confirm' => 'Are you sure you wish to action?'
	 *     )
	 * )
	 */
	public function allowedActions() {
		return array();
	}

	public function getDryRun() {
		return $this->Pipeline()->DryRun;
	}

}
