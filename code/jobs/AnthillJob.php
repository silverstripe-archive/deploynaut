<?php

/**
 * Ideally, we would enqueue AnthillJobs straight from the deploynaut where possible, bypassing half a dozen
 * layers of abstraction in the process. For this to happen though we would need to:
 * - remove DNEnvironment, DNProject dependencies from jobs see DeploymentBackend interface.
 * - construct ClientFactory to reflect the authorisation context (right now it's null in DeploynautJob::runOp).
 *
 * This would be a nice first step towards decoupling workers from Deploynaut, because it would introduce
 * an array-only API to job subsystem (based on Anthill Params). This wouldn't really work for Capistrano,
 * because (a) it doesn't run on Anthill, (b) it relies on local capistrano config files, which would need
 * to be somehow copied to the workers.
 *
 * In any caase, to decouple, we'd need to additionally:
 * - be able to fetch log files remotely (HTTP from worker? Redis? - no local file access)
 * - remove triggers in jobs that update the job status (state machine) in the SS DB. Would
 *   need some kind of a polling mechanism in Deploynaut to constantly query resque and update status in DB.
 *
 * With that, we would be able to enqueue jobs from Deploynaut like this:
 * 		$params = new Anthill\Operations\Params\Smoketest([
 *			'url' => 'silverstripe.com/host.txt',
 *		]);
 *		Resque::enqueue('deploy', 'AnthillJob', [
 *			'Smoketest',
 *			$params->toArray()
 *		], true);
 */
class AnthillJob extends DeploynautJob {

	public function perform() {
		$opName = $this->args['opName'];
		$params = $this->args['params'];
		$paramClass = sprintf('SilverStripe\Platform\Core\Rainforest\Anthill\Operations\Params\%s', $opName);
		$runner = $this->runOp($opName, new $paramClass($params));
		if (!$runner->isSuccessful()) {
			throw $runner->getFailureException();
		}
	}

	protected function updateStatus($status) {
		// No-op
	}

}
