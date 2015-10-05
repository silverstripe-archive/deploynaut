<?php

/**
 * DNFilteredCommits
 *
 *  Base class to represent filtered commits
 *  This defaults to finshed commits but can be overridden by calling setFilter
 *  or by extending the class and calling setFilter in the __construct
 *
 *  To specify this class or a class extending from this set FilteredCommits in the
 *  the environment yml file
 *
 *  PipelineConfig:
 *   OnSuccessNotify: <instance-manager>,<requester>,ops@silverstripe.com
 *   OnFailureNotify: <instance-manager>,<requester>,ops@silverstripe.com
 *   DependsOnProject: "project1"
 *   DependsOnEnvironment: "env2"
 *   FilteredCommits: "DNFinishedCommits"
 *  Steps:
 *    SmokeTestPipelineStepBefore:
 *    Class: SmokeTestPipelineStep
 *    PerformTestOn: 'DependentEnvironment'
 *  DeploymentPipelineStep:
 *    Class: DeploymentPipelineStep
 *  SmokeTestPipelineStepAfter:
 *    Class: SmokeTestPipelineStep
 *    PerformTestOn: 'ThisEnvironment'
 *
 */
class DNFilteredCommits extends Object {

	public $env;

	private $filter;

	private $environmentExceptionError = 'Environment has not been set';

	// default sort to be by the latest commit
	protected $sort = 'DESC';

	public function setFilter($filter = 'Finished') {
		$this->filter = $filter;
	}

	public function getCommits() {
		if(!isset($this->env)) {
			$this->environmentNotSetException();
		}
		$successfulCommits =
			$this->env->DeployHistory()->filter(
				array('Status' => $this->filter, 'EnvironmentID' => $this->env->ID)
			)->sort('Created', $this->sort);
		return $successfulCommits;
	}

	public function getLatestCommit() {
		if(!isset($this->env)) {
			$this->environmentNotSetException();
		}
		$commits = $this->getCommits();
		return $commits->first();
	}

	private function environmentNotSetException() {
		throw new Exception($this->environmentExceptionError);
	}

}
