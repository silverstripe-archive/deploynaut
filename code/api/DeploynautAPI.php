<?php
/**
 * Entry point for the deploynaut API
 * 
 * /naut/api/projectname/
 * /naut/api/projectname/environmentname
 * 
 * @todo It might be good to break this out to a controller chain so that 
 * "/naut/api/projectname/environmentname" controller chain becomes
 * DeploynautAPI > APIProject > APIEnvironment
 * 
 */
class DeploynautAPI extends APINoun {
	
	/**
	 * Default URL handlers - (Action)/(ID)//(OtherID)
	 */
	private static $url_handlers = array(
		'' => 'listProjects',
		'pushhook/' => 'pushhook',
		'$Project//fetch' => 'project',
		'$Project/$Environment!' => 'environment',
		'$Project/' => 'project',
	);
	
	/**
	 *
	 * @var array
	 */
	public static $allowed_actions = array(
		'project',
		'environment',
		'listProjects',
		'pushhook',
	);
	
	/**
	 *
	 * @var string
	 */
	protected $link = 'deploynaut/api';
	
	/**
	 * 
	 * @param SS_HTTPRequest $request
	 * @return string
	 */
	public function listProjects(SS_HTTPRequest $request) {
		$response = array(
			'href' => Director::absoluteURL($this->Link()),
			'projects' => array(),
		);

		if($request->httpMethod() != 'GET') return $this->message('API not found', 404);;

		foreach(DNProject::get() as $item) {
			if($item->canView($this->getMember())) {
				$response['projects'][] = array(
					"name" => $item->Name,
					"href" => Director::absoluteURL($item->APILink("")),
				);
			}
		}

		return $this->getAPIResponse($response);
	}
	
	/**
	 * Controller Action
	 * 
	 * @param SS_HTTPRequest $request
	 * @return APIProject
	 */
	public function project(SS_HTTPRequest $request) {
		$project = $this->getProject();
		if(!$project) {
			return new SS_HTTPResponse('Project "' . Convert::raw2xml($request->latestParam('Project')) . '" not found.', 404);
		}
		return new APIProject($this, $project);
	}
	
	/**
	 * Controller Action
	 * 
	 * @param SS_HTTPRequest $request
	 * @return APIEnvironment
	 */
	public function environment(SS_HTTPRequest $request) {
		$project = $this->getProject();
		if(!$project) {
			return new SS_HTTPResponse('Project "' . Convert::raw2xml($request->latestParam('Project')) . '" not found.', 404);
		}
		
		$environment = $this->getEnvironment();
		if(!$environment) {
			return new SS_HTTPResponse('Environment "' . Convert::raw2xml($request->latestParam('Environment')) . '" not found.', 404);
		}
		return new APIEnvironment($this, $environment);
	}
	
	/**
	 * Get project from URL
	 * 
	 * @return DNProject
	 */
	protected function getProject() {
		$projectName = $this->getRequest()->param('Project');
		return DNProject::get()->filter('Name', $projectName)->first();
	}
	
	/**
	 * Get environment from URL
	 * 
	 * @return DNEnvironment
	 */
	protected function getEnvironment() {
		$projectName = $this->getRequest()->param('Project');
		$project = DNProject::get()->filter('Name', $projectName)->first();
		$environmentName = $this->getRequest()->param('Environment');
		return $project->Environments()->filter('Name', $environmentName)->first();
	}

	public function pushhook() {
		// get the request body
		$body = $this->getRequestBody();
		if (empty($body)) {
			throw new Exception("Request body empty");
		}

		// To properly do matching, we need a parsed, valid, URL
		$url = parse_url($body['repository']['url']);
		if (!$url || empty($url['host']) || empty($url['path'])) {
			// All those values are required for matching, though Gitlab will not always give them all
			throw new Exception("Unknown URL");
		}

		// Rather than doing all the matching in PHP, we can get a "good enough" result with this for now
		$projects = DNProject::get()->filter(array('CVSPath:PartialMatch' => $url['path']));
		if (empty($projects)) {
			throw new Exception("No projects found");
		}
		foreach ($projects as $project) {
			// Do host validation too
			$projecturl = parse_url($project->CVSPath);
			if (!$projecturl || empty($url['host']) || empty($url['path'])) {
				// Invalid URL
				continue;
			}
			if ($projecturl['host'] != $url['host']) {
				// Non-matching URL
				continue;
			}
			// If we're here, we should get around to doing the Fetch!
			$fetch = DNGitFetch::create();
			$fetch->ProjectID = $project->ID;
			$fetch->write();
			$fetch->start();
		}
		// TODO: Fix this with a proper way to return without causing an error
	}
	
	/**
	 * 
	 * @return string
	 */
	public function Link() {
		return 'naut/api';
	}
}
