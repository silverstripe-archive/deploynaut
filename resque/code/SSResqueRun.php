<?php

require_once BASE_PATH.'/resque/vendor/autoload.php';

class SSResqueRun extends Controller {

	protected $queue = null;

	protected $backend = null;

	protected $count = 1;

	protected $logLevel = null;

	protected $interval = 10;
	
	
	/**
	 * Check that all needed and option params have been set
	 *
	 *
	 */
	public function init() {
		parent::init();
		
		if(php_sapi_name() !== 'cli') {
			echo 'The resque runner must be run in a CLI environment.';
			exit(1);
		}

		if(!$this->request->getVar('backend')) {
			Resque::setBackend($this->request->getVar('backend'));
		}

		$this->count = $this->request->getVar('count');

		$logLevel = 0;
		$logging = $this->request->getVar('logging');
		$verbose = $this->request->getVar('verbose');
		$vverbose = $this->request->getVar('vverbose');
		if(!empty($logging) || !empty($verbose)) {
			$this->logLevel = Resque_Worker::LOG_NORMAL;
		} else if(!empty($vverbose)) {
			$this->logLevel = Resque_Worker::LOG_VERBOSE;
		}
	}

	/**
	 * This is where the action starts
	 *
	 * @param SS_HTTPRequest $request
	 */
	public function index(SS_HTTPRequest $request) {
		if(!$request->getVar('queue')) {
			die("Set 'queue' parameter to containing the list of queues to work on.\n");
		}
		$this->queue = $request->getVar('queue');
		
		if($this->count > 1) {
			$this->fork($this->count);
		} else {
			$this->startWorker();	
		}
	}

	/**
	 * Start up multiple workers
	 *
	 * @param int $workers - how many workers should be started
	 */
	protected function fork($workers=1) {
		for($i = 0; $i < $workers; ++$i) {
			$pid = pcntl_fork();
			if($pid == -1) {
				die("Could not fork worker ".$i."\n");
			}
			// Child, start the worker
			else if(!$pid) {
				$this->startWorker(true);
				break;
			}
		}
	}

	/**
	 * Start a single worker
	 *
	 * @param bool $forked - is this worker forked
	 */
	protected function startWorker($forked=false) {
		$queues = explode(',', $this->queue);
		$worker = new Resque_Worker($queues);
		$worker->logLevel = $this->logLevel;
		
		if(!$forked) {
			$PIDFILE = getenv('PIDFILE');
			if($PIDFILE) {
				file_put_contents($PIDFILE, getmypid()) or die('Could not write PID information to ' . $PIDFILE);
			}
		}

		fwrite(STDOUT, '*** Starting worker '.$worker." ".$this->interval.PHP_EOL);
		$worker->work($this->interval);
	}
}