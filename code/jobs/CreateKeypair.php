<?php

/**
 * Class CreateKeypair
 *
 * This is ran by the resque worker. It creates a single keypair for a given stack.
 */
class CreateKeypair {

	/**
	 * @var array
	 */
	public $args;

	/**
	 * @var resource - file
	 */
	protected $logHandle;

	/**
	 *
	 * @global array $databaseConfig
	 */
	public function setUp() {
		global $databaseConfig;
		DB::connect($databaseConfig);
		chdir(BASE_PATH);

		$this->logHandle = fopen(DEPLOYNAUT_LOG_PATH . '/createstackkeypair.log', 'a');
	}

	/**
	 * @throws RuntimeException
	 */
	public function perform() {
		set_time_limit(0);

		// name is required.
		if(!isset($this->args['name'])) {
			$msg = sprintf('[%s] name argument missing.', date('Y-m-d H:i:s')) . PHP_EOL;
			fwrite($this->logHandle, $msg);
			throw new RuntimeException($msg);
		}

		// keyDir is needed os that we know where to put the keys
		if(!isset($this->args['keyDir'])) {
			$msg = sprintf('[%s] keyDir argument missing.', date('Y-m-d H:i:s')) . PHP_EOL;
			fwrite($this->logHandle, $msg);
			throw new RuntimeException($msg);
		}

		// Default overwrite SSH keys to false.
		if(!isset($this->args['overwrite'])) {
			$this->args['overwrite'] = false;
		}

		// Ensure the directory is set with the correct permissions
		if(!is_dir($this->args['keyDir'])) {
			fwrite($this->logHandle, sprintf('[%s] Create directory: %s', date('Y-m-d H:i:s'), $this->args['keyDir']) . PHP_EOL);
			mkdir($this->args['keyDir'], 0755, true);
		}

		// ...and finally we check if the file exists or if we're overwriting the key pair.
		$keyFile = $this->args['keyDir'] . '/' . $this->args['name'];
		if(!file_exists($keyFile) || $this->args['overwrite'] === true) {
			fwrite($this->logHandle, sprintf('[%s] Create keypair: %s', date('Y-m-d H:i:s'), $keyFile) . PHP_EOL);

			// Throws a RuntimeException if it fails
			try {
				$this->createKeys($keyFile);
			} catch(Exception $e) {
				fwrite(
					$this->logHandle,
					sprintf('[%s] Error: %s', date('Y-m-d H:i:s'), $e->getMessage()) . PHP_EOL
				);
				throw $e;
			}
		} else {
			$msg = sprintf('[%s] Keypair already exists: %s', date('Y-m-d H:i:s'), $keyFile);
			fwrite(
				$this->logHandle,
				$msg . PHP_EOL
			);
			throw new RuntimeException($msg);
		}
	}

	public function tearDown() {
		fclose($this->logHandle);
	}

	/**
	 * @param $keyFile string - path to private key file
	 * @throws RuntimeException
	 */
	protected function createKeys($keyFile) {
		$command = sprintf('ssh-keygen -q -t rsa -f %s -C %s -N ""', escapeshellarg($keyFile), escapeshellarg(basename($keyFile)));

		$process = new AbortableProcess($command);
		$process->run();
		if(!$process->isSuccessful()) {
			fwrite(
				$this->logHandle,
				sprintf('[%s] Error creating keypair: %s', date('Y-m-d H:i:s'), $process->getErrorOutput()) . PHP_EOL
			);
			throw new RuntimeException($process->getErrorOutput());
		} else {
			fwrite(
				$this->logHandle,
				sprintf('[%s] Created new keypair for stack: %s', date('Y-m-d H:i:s'), $keyFile) . PHP_EOL
			);

			// Set permissions on the newly created keys
			// chmod ($file, 600) doesn't set the correct permissions for some reason.
			$process = new AbortableProcess(sprintf('chmod 600 %s', $keyFile));
			$process->run();
			if(!$process->isSuccessful()) {
				fwrite(
					$this->logHandle,
					sprintf('[%s] %s', date('Y-m-d H:i:s'), $process->getErrorOutput()) . PHP_EOL
				);
			}

			$process = new AbortableProcess(sprintf('chmod 600 %s', $keyFile . '.pub'));
			$process->run();
			if(!$process->isSuccessful()) {
				fwrite(
					$this->logHandle,
					sprintf('[%s] %s', date('Y-m-d H:i:s'), $process->getErrorOutput()) . PHP_EOL
				);
			}
		}
	}

}
