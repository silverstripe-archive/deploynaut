<?php

/**
 * Class SmokeTestPipelineTest
 * This class performs a 'smoke test' against a {@link DNEnvironment}. This smoke test is specific to the environment,
 * but generally consists of:
 * - Checking the homepage (and other key pages, if specified) for a HTTP response 'Status' code of 200
 * - Perhaps checking 'dev/check' for sites that include the environmentcheck module
 *     ({@see https://github.com/silverstripe-labs/silverstripe-environmentcheck}).
 *
 * Note that this step can also be reused as a special conditional smoke test configured on the Pipeline itself - see
 * the Pipeline documentation for details. You should override the "Tests" configuration variable on the Pipeline
 * otherwise it will use the default: hit the homepage and expect 200.
 *
 * <code>
 * Pipeline:
 *   Tests: # Used by both rollback and smoke test
 *     Home:
 *       URL: http://www.mysite.com/
 *       ExpectStatus: 200
 *     Videos:
 *       URL: http://www.mysite.com/videos/
 *       ExpectStatus: 200
 * Steps:
 *   SmokeTest:
 *     Class: SmokeTestPipelineStep
 *     MaxDuration: 3600
 *     Tests: # Tests only used by deployment smoketest
 *       ExtraTest:
 *         URL: http://www.mysite.com/another/
 *         ExpectStatus: 200
 * RollbackStep2:
 *   Class: SmokeTestPipelineStep
 *   Tests: # Tests only used by rollback smoketest
 *     RollbackTest:
 *       URL: http://www.mysite.com/check-status/
 *       ExpectedStatus: 200
 * </code>
 *
 * @package deploynaut
 * @subpackage pipeline
 */
class SmokeTestPipelineStep extends PipelineStep {

	/**
	 * Get all tests to be run by this smoketest
	 *
	 * @return array List of tests
	 */
	protected function getTests() {
		$tests = $this->getConfigSetting('Tests');
		$defaultTests = $this->Pipeline()->getConfigSetting('PipelineConfig', 'Tests');
		if(!$tests) return $defaultTests;

		// If we have both tests and defaults merge them
		if($defaultTests) Config::merge_array_low_into_high($tests, $defaultTests);
		return $tests;
	}

	public function start() {
		$this->Status = 'Started';
		$this->log("Starting {$this->Title}...");
		$this->write();

		$tests = $this->getTests();

		// if there's no tests to check for, fallback to trying to find the
		// site's homepage by looking at the DNEnvironment fields.
		if(!($tests && count($tests) > 0)) {

			// determine which environment to test from configuration
			$environment = $this->getDependentEnvironment();

			$url = $environment->URL;

			if(!$url) {
				$this->log(sprintf(
					'Smoke test failed. Could not find a website URL in environment "%s"',
					$environment->Name
				));
				$this->markFailed();
				return false;
			}

			$tests['default'] = array(
				'URL' => $url,
				'ExpectStatus' => 200
			);
		}

		// work through each of the configured tests and perform a web request and check the result
		$ch = curl_init();
		$failed = false;

		foreach($tests as $name => $test) {
			$this->log(sprintf('Starting smoke test "%s" to URL %s', $name, $test['URL']));

			curl_setopt($ch, CURLOPT_URL, $test['URL']);

			// avoid curl_exec pushing out the response to the screen
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

			curl_setopt($ch, CURLOPT_TIMEOUT, 10); // don't allow this to run for more than 10 seconds to avoid tying up webserver processes.

			// if we need to use a proxy, ensure that is configured
			if(defined('SS_OUTBOUND_PROXY')) {
				curl_setopt($ch, CURLOPT_PROXY, SS_OUTBOUND_PROXY);
				curl_setopt($ch, CURLOPT_PROXYPORT, SS_OUTBOUND_PROXY_PORT);
			}

			$contents = curl_exec($ch);
			if(curl_errno($ch)) {
				$this->log(sprintf('Curl error: %s', curl_error($ch)));
				$failed = true;
				continue;
			}

			$info =	curl_getinfo($ch);

			// if an expected response time is specified, check that against the results
			if(isset($test['ExpectResponse'])) {
				if($info['total_time'] > $test['ExpectResponse']) {
					$this->log(sprintf(
						'Smoke test "%s" to URL %s failed. Expected response time %s seconds, actual was %s seconds',
						$name,
						$test['URL'],
						$test['ExpectResponse'],
						$info['total_time']
					));
					$failed = true;
					continue;
				}
			}

			if($info['http_code'] != $test['ExpectStatus']) {
				$this->log("=================================================================");
				$this->log(sprintf(
					"Printing output from smoke test '%s' (URL: '%s'):",
					$name,
					$test['URL']
				));
				$this->log(sprintf("HTTP Status Code: %d", $info['http_code']));
				$this->log($contents ? $contents : "No output (check status code?)");
				$this->log("=================================================================");

				$this->log(sprintf(
					'Smoke test "%s" to URL %s failed. Expected status code %s, got %s. See above for HTML returned.',
					$name,
					$test['URL'],
					$test['ExpectStatus'],
					$info['http_code']
				));
				$failed = true;
				continue;
			}

			$this->log(sprintf('Smoke test "%s" to URL %s successful', $name, $test['URL']));
		}

		curl_close($ch);

		if($failed) {
			// At least one test failed, so mark the test as failed
			$this->markFailed();
			return false;
		} else {
			$this->finish();
			return true;
		}
	}

	public function markFailed($notify = true) {
		if($this->getDryRun()) {
			$this->log("[Skipped] Smoke testing failed: Putting up emergency maintenance page");
		} else {
			// Put up maintenance page after this fails
			$this->log("Smoke testing failed: Putting up emergency maintenance page");
			$this->Pipeline()->Environment()->enableMaintenace($this->Pipeline()->getLogger());
		}

		// Mark pipeline and step failed
		parent::markFailed($notify);
	}

}
