<?php

use \SilverStripe\Platform\Core\Rainforest\Anthill;
use \SilverStripe\Platform\Core\Rainforest;

abstract class DeploynautJob implements DeploynautJobInterface {

	/**
	 * @var array
	 */
	public $args;

	abstract protected function updateStatus($status);

	/**
	 * Poll the sigFile looking for a signal to self-deliver.
	 * This is useful if we don't know the PID of the worker - we can easily deliver signals
	 * if we only know the ClassName and ID of the DataObject.
	 */
	public function alarmHandler() {
		$sigFile = $this->args['sigFile'];
		if (file_exists($sigFile) && is_readable($sigFile) && is_writable($sigFile)) {
			$signal = (int)file_get_contents($sigFile);
			if (is_int($signal) && in_array((int)$signal, [
				// The following signals are trapped by both Resque and Rainforest.
				SIGTERM,
				SIGINT,
				SIGQUIT,
				// The following are Resque only.
				SIGUSR1,
				SIGUSR2,
				SIGCONT
			])) {
				echo sprintf(
					'[-] Signal "%s" received, delivering to own process group, PID "%s".' . PHP_EOL,
					$signal,
					getmypid()
				);

				// Mark the signal as received.
				unlink($sigFile);

				// Dispatch to own process group.
				$pgid = posix_getpgid(getmypid());
				if ($pgid<=0) {
					echo sprintf(
						'[-] Unable to send signal to invalid PGID "%s".' . PHP_EOL,
						$pgid
					);
				} else {
					posix_kill(-$pgid, $signal);
				}
			}
		}

		// Wake up again soon.
		pcntl_alarm(1);
	}

	public function setUp() {
		// Make this process a session leader so we can send signals
		// to this job as a whole (including any subprocesses such as spawned by Symfony).
		posix_setsid();

		if(function_exists('pcntl_alarm') && function_exists('pcntl_signal')) {
			if (!empty($this->args['sigFile'])) {
				echo sprintf('[-] Signal file requested, polling "%s".' . PHP_EOL, $this->args['sigFile']);
				declare(ticks = 1);
				pcntl_signal(SIGALRM, [$this, 'alarmHandler']);
				pcntl_alarm(1);
			}
		}

		chdir(BASE_PATH);
	}

	/**
	 * {@inheritdoc}
	 */
	public function onFailure(Exception $exception) {
		$this->updateStatus('Failed');
	}

	public function runOp($opName, Anthill\Interfaces\Params $params, \Psr\Log\LoggerInterface $logger = null) {
		if (!$logger) {
			$logger = new \Psr\Log\NullLogger;
		}
		$container = Anthill\Anthill::bootstrap(
			// For now only operations that don't use the ClientFactory are supported.
			// This would ideally support passing platform-agnostic credentials so we could
			// support both capistrano and aws.
			null,
			$logger
		);
		$factory = $container->get('SilverStripe\Platform\Core\Rainforest\Anthill\RunnerFactory');
		$runner = $factory->getDefault($opName, $params);
		$runner->execute();
		return $runner;
	}

}
