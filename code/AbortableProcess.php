<?php
/**
 * AbortableProcess implements a workaround to make Symfony Process not kill itself when we
 * trap a Unix signal.
 *
 * Process is relying on error_get_last to learn if the stream reading was interrupted by a signal
 * (see UnixSignal's readAndWrite, the hasSystemCallBeenInterrupted call). Unfortunately this doesn't
 * work if we trapp the signal, which wipes out the error, which makes Process think it's some
 * other kind of error which makes it commit suicide for no good reason.
 *
 * Workaround is to avoid blocking stream_select as ->run nor ->wait do. Fortunately we can call
 * ->isRunning instead, which uses a non-blocking readPipes via updateStatus. This means our callback
 * will still get called if we loop over ->isRunning.
 */
class AbortableProcess extends \Symfony\Component\Process\Process {
	public function run($callback = null) {
		$this->start($callback);
		while($this->isRunning()) {
			$this->checkTimeout();
			sleep(1);
		}

		if ($this->hasBeenSignaled()) {
			throw new RuntimeException(sprintf(
				'The process has been signaled with signal "%s".',
				$this->getTermSignal())
			);
		}

		return $this->getExitCode();
	}
}
