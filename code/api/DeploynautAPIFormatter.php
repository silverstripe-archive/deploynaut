<?php

class DeploynautAPIFormatter {

	/**
	 * This is a per request cache of $project()->listMembers()
	 * @var null|array
	 */
	private static $_cache_project_members = null;

	/**
	 * This is a per request cache of $environment->CurrentBuild();
	 * @var null|DNDeployment
	 */
	private static $_cache_current_build = null;

	/**
	 * Return data about a single deployment for use in API response.
	 * @param \DNDeployment $deployment
	 * @return array
	 */
	public function getDeploymentData(\DNDeployment $deployment) {
		if (empty(self::$_cache_current_build[$deployment->EnvironmentID])) {
			self::$_cache_current_build[$deployment->EnvironmentID] = $deployment->Environment()->CurrentBuild();
		}

		$environment = $deployment->Environment();
		$project = $environment->Project();

		$deployer = $deployment->Deployer();
		$deployerData = null;
		if ($deployer && $deployer->exists()) {
			$deployerData = $this->getStackMemberData($project, $deployer);
		}
		$approver = $deployment->Approver();
		$approverData = null;
		if ($approver && $approver->exists()) {
			$approverData = $this->getStackMemberData($project, $approver);
		}

		// failover for older deployments
		$started = $deployment->Created;
		$startedNice = $deployment->obj('Created')->Nice();
		if($deployment->DeployStarted) {
			$started = $deployment->DeployStarted;
			$startedNice = $deployment->obj('DeployStarted')->Nice();
		}

		$isCurrentBuild = self::$_cache_current_build[$deployment->EnvironmentID]
			? ($deployment->ID === self::$_cache_current_build[$deployment->EnvironmentID]->ID)
			: false;

		$supportedOptions = $environment->getSupportedOptions();
		$setOptions = $deployment->getDeploymentStrategy() ? $deployment->getDeploymentStrategy()->getOptions() : [];
		$options = [];

		foreach ($supportedOptions as $option) {
			if (!isset($setOptions[$option->getName()])) {
				continue;
			}
			if ($setOptions[$option->getName()] === 'true' || $setOptions[$option->getName()] === true) {
				$options[$option->getName()] = true;
			}
		}

		$tags = [];
		try {
			$tags = $deployment->getTags()->toArray();
		} catch (\Exception $e) {
			// gitonomy exception
		}

		return [
			'id' => $deployment->ID,
			'date_created' => $deployment->Created,
			'date_created_nice' => $deployment->obj('Created')->Nice(),
			'date_started' => $started,
			'date_started_nice' => $startedNice,
			'date_requested' => $deployment->DeployRequested,
			'date_requested_nice' => $deployment->obj('DeployRequested')->Nice(),
			'date_updated' => $deployment->LastEdited,
			'date_updated_nice' => $deployment->obj('LastEdited')->Nice(),
			'title' => $deployment->Title,
			'summary' => $deployment->Summary,
			'branch' => $deployment->Branch,
			'tags' => $tags,
			'changes' => $deployment->getDeploymentStrategy()->getChanges(),
			'deployment_type' => $deployment->getDeploymentStrategy()->getActionCode(),
			'deployment_estimate' => $deployment->getDeploymentStrategy()->getEstimatedTime(),
			'sha' => $deployment->SHA,
			'short_sha' => substr($deployment->SHA, 0, 7),
			'ref_type' => $deployment->RefType,
			'options' => $options,
			'commit_message' => $deployment->getCommitMessage(),
			'commit_url' => $deployment->getCommitURL(),
			'deployer' => $deployerData,
			'approver' => $approverData,
			'state' => $deployment->State,
			'is_current_build' => $isCurrentBuild
		];
	}

	/**
	 * Return data about a particular {@link Member} of the stack for use in API response.
	 * Note that role can be null in the response. This is the case of an admin, or an operations
	 * user who can create the deployment but is not part of the stack roles.
	 *
	 * @param \DNProject $project
	 * @param \Member $member
	 * @return array
	 */
	public function getStackMemberData(\DNProject $project, \Member $member) {
		if (empty(self::$_cache_project_members[$project->ID])) {
			self::$_cache_project_members[$project->ID] = $project->listMembers();
		}

		$role = null;
		foreach (self::$_cache_project_members[$project->ID] as $stackMember) {
			if ($stackMember['MemberID'] !== $member->ID) {
				continue;
			}
			$role = $stackMember['RoleTitle'];
		}

		return [
			'id' => $member->ID,
			'email' => $member->Email,
			'role' => $role,
			'name' => $member->getName()
		];
	}

}
