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
class DeploynautAPI extends Controller {
	
	/**
	 * Default URL handlers - (Action)/(ID)//(OtherID)
	 */
	private static $url_handlers = array(
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
		'environment'
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
	public function index(SS_HTTPRequest $request) {
		return 'This is the base.';
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
			return new SS_HTTPResponse('Project "' . $request->latestParam('Project') . '" not found.', 404);
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
			return new SS_HTTPResponse('Project "' . $request->latestParam('Project') . '" not found.', 404);
		}
		
		$environment = $this->getEnvironment();
		if(!$environment) {
			return new SS_HTTPResponse('Environment "' . $request->latestParam('Environment') . '" not found.', 404);
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
	
	/**
	 * 
	 * @return string
	 */
	public function Link() {
		return 'naut/api';
	}
}
