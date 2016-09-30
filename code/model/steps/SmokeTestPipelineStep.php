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
 *     Videos:
 *       URL: http://www.mysite.com/videos/
 *       Attempts: 1 # This test should only be attempted once
 * Steps:
 *   SmokeTest:
 *     Class: SmokeTestPipelineStep
 *     MaxDuration: 3600
 *     RequestTimeout: 13
 *     Attempts: 2 # Tests get 2 attempts each
 *     Tests: # Tests only used by deployment smoketest
 *       ExtraTest:
 *         URL: http://www.mysite.com/another/
 * RollbackStep2:
 *   Class: SmokeTestPipelineStep
 *   Attempts: 3 # Allow more attempts on rollback
 *   Tests: # Tests only used by rollback smoketest
 *     RollbackTest:
 *       URL: http://www.mysite.com/check-status/
 * </code>
 *
 * @package deploynaut
 * @subpackage pipeline
 */
class SmokeTestPipelineStep extends PipelineStep {

	/**
	 * Default config setting
	 *
	 * @var array
	 * @config
	 */
	private static $default_config = array(
		'RequestTimeout' => 20, // Seconds to allow for each request
		'Attempts' => 1, // Number of attempts allowed
		'AttemptDelay' => 10 // Timeout between requests
	);

	/**
	 * @var array
	 * @config
	 */
	private static $bad_status_codes = array(500, 501, 502, 503, 504);

	/**
	 * Get all tests to be run by this smoketest
	 *
	 * @return array List of tests
	 */
	protected function getTests() {
		// Get core tests
		$tests = $this->getConfigSetting('Tests');

		// Merge with default tests
		$defaultTests = $this->Pipeline()->getConfigSetting('PipelineConfig', 'Tests');
		if($tests && $defaultTests) {
			Config::merge_array_low_into_high($tests, $defaultTests);
		} elseif(!$tests && $defaultTests) {
			$tests = $defaultTests;
		}
		if($tests) return $tests;

		// if there's no tests to check for, fallback to trying to find the
		// site's homepage by looking at the DNEnvironment fields.
		$environment = $this->getDependentEnvironment();
		$url = $environment->URL;
		if($url) {
			return array(
				'default' => array(
					'URL' => $url,
				)
			);
		}
	}

	/**
	 * Initialiase curl handle
	 *
	 * @return resource Curl handle
	 */
	protected function initCurl() {
		//do not bypass proxy by default
		$bypassProxy = false;
		$handle = curl_init();

		// avoid curl_exec pushing out the response to the screen
		$timeout = $this->getConfigSetting('RequestTimeout');
		curl_setopt($handle, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($handle, CURLOPT_TIMEOUT, $timeout);
		// don't allow this to run for more than 10 seconds to avoid tying up webserver processes.

		//check the pipelines settings to see if we should bypass the proxy
		if($this->Pipeline()->getConfigSetting('PipelineConfig', 'bypassProxy')){
			$bypassProxy = $this->Pipeline()->getConfigSetting('PipelineConfig', 'bypassProxy');
		}
		// if we need to use a proxy, ensure that is configured
		if(defined('SS_OUTBOUND_PROXY') && !$bypassProxy) {
			curl_setopt($handle, CURLOPT_PROXY, SS_OUTBOUND_PROXY);
			curl_setopt($handle, CURLOPT_PROXYPORT, SS_OUTBOUND_PROXY_PORT);
		}
		return $handle;
	}

	/**
	 * Run a single test
	 *
	 * @param resource $ch Curl resource
	 * @param string $name Test name
	 * @param array $test Test data
	 * @return bool success
	 */
	public function runTest($ch, $name, $test) {
		$this->log(sprintf('Starting smoke test "%s" to URL %s', $name, $test['URL']));
		curl_setopt($ch, CURLOPT_URL, $test['URL']);

		// Allow individual tests to override number of attempts
		$attempts = (int) $this->getConfigSetting('Attempts');
		if(!empty($test['Attempts'])) $attempts = $test['Attempts'];

		// Run through each attempt
		for($i = 0; $i < $attempts; $i++) {
			if($i > 0) {
				$this->log("Request failed, performing reattempt (#{$i})");

				// Ensure a non-zero delay between each request
				$delay = $this->getConfigSetting('AttemptDelay');
				sleep($delay);
			}

			// Perform request
			$contents = curl_exec($ch);
			if(curl_errno($ch)) {
				$this->log(sprintf('Curl error: %s', curl_error($ch)));
				continue;
			}

			// Check response
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
					continue;
				}
			}

			// check the HTTP response code
			$statusSuccess = false;
			$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
			if($status && !in_array($status, $this->config()->bad_status_codes)) {
				$statusSuccess = true;
			}

			if($statusSuccess === false) {
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
					'Smoke test "%s" to URL %s failed with HTTP status %s. See above for HTML returned.',
					$name,
					$test['URL'],
					$info['http_code']
				));
				continue;
			}

			$this->log(sprintf('Smoke test "%s" to URL %s successful', $name, $test['URL']));
			return true;
		}

		// Run out of re-attempts
		if($attempts > 1) $this->log("Failed after {$attempts} attempts");
 		return false;
	}

	public function start() {
		$this->Status = 'Started';
		$this->log("Starting {$this->Title}...");
		$this->write();

		// Get tests to run
		$tests = $this->getTests();
		if(empty($tests)) {
			$this->log('No smoke tests available. Aborting');
			$this->markFailed();
			return false;
		}

		// work through each of the configured tests and perform a web request and check the result
		$ch = $this->initCurl();
		$success = true;
		foreach($tests as $name => $test) {
			$testSuccess = $this->runTest($ch, $name, $test);
			$success = $testSuccess && $success;
		}
		curl_close($ch);

		// Check result
		if($success) {
			$this->finish();
		} else {
			// At least one test failed, so mark the test as failed
			$this->markFailed();
		}
		return $success;
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
