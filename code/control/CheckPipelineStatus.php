<?php

/**
 * Class CheckPipelineStatus
 * This class is expected to be called by the /etc/init.d/deploynaut-pipeline daemon, and not manually or via the
 * command line. It should perform checks to ensure that this is the case.
 *
 * @package deploynaut
 * @subpackage control
 */
class CheckPipelineStatus extends Controller {
	public function index() {
		// @TODO Check that we have been called via the daemon
		if(php_sapi_name() != "cli") {
			throw new Exception("CheckPipelineStatus must be run from the command-line.");
		}

		$this->run();
	}

	private function run() {
		// Note that a pipeline must be started prior to being picked up by this task
		$runningPipelines = Pipeline::get()->filter('Status', array('Running', 'Rollback'));

		printf(
			"%s Checking status of %d pipelines... ",
			"[" . date("Y-m-d H:i:s") . "]",
			$runningPipelines->count()
		);

		foreach($runningPipelines as $pipeline) {
			$pipeline->checkPipelineStatus();
		}

		echo "done!" . PHP_EOL;
	}
}
