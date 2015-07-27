<?php

class PipelineController extends Controller {

	private static $allowed_actions = array(
		'abort',
		'log',
		'step'
	);

	protected $controller = null;

	protected $pipeline = null;

	public function __construct($controller, Pipeline $pipeline) {
		$this->controller = $controller;
		parent::__construct();
		$this->pipeline = $pipeline;
	}

	/**
	 * Shows status of this pipeline
	 */
	public function index() {
		return $this->controller->customise(new ArrayData(array(
			'Pipeline' => $this->pipeline
		)))->renderWith('DNRoot_pipeline');
	}

	/**
	 * Get log for this pipeline
	 */
	public function log() {
		$log = $this->pipeline->getLogger();
		if($log->exists()) {
			$content = $log->content();
		} else {
			$content = 'Waiting for action to start';
		}

		$sendJSON = (strpos($this->request->getHeader('Accept'), 'application/json') !== false)
			|| $this->request->getExtension() == 'json';

		$content = preg_replace('/(?:(?:\r\n|\r|\n)\s*){2}/s', "\n", $content);
		if($sendJSON) {
			$this->response->addHeader("Content-type", "application/json");
			return json_encode(array(
				'status' => $this->pipeline->Status,
				'content' => $content,
			));

		} else {
			$this->response->addHeader("Content-type", "text/plain");
			return $content;
		}
	}

	/**
	 * Aborts the current pipeline
	 */
	public function abort() {
		if($this->pipeline->canAbort()) {
			$this->pipeline->markAborted();
		}
		return $this->redirect($this->pipeline->Environment()->Link());
	}

	/**
	 * Perform an action on the current pipeline step
	 */
	public function step() {
		$action = $this->request->param('ID');
		$step = $this->pipeline->CurrentStep();

		// Check if the action is available on this step
		if($step && ($actions = $step->allowedActions()) && isset($actions[$action])) {
			// Execute this action, allowing it to override the httpresponse given
			$step->$action();
		}
		return $this->redirect($this->pipeline->Environment()->Link());
	}
}
