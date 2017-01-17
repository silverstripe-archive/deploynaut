<?php

class DeploynautAPIFormatter {

	/**
	 * This is a per request cache of $project()->listMembers()
	 * @var null|array
	 */
	private static $_cache_project_members = null;

	/**
	 * This is a per request cache of Members
	 * @var null|array
	 */
	private static $_cache_members = null;

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

		$deployerData = $this->getStackMemberData($project, $deployment->DeployerID);
		$approverData = $this->getStackMemberData($project, $deployment->ApproverID);

		$started = null;
		$startedNice = null;
		$startedAgo = null;
		// we check first, before we do a expensive ->Nice() and ->Ago()
		if(!$deployment->DeployStarted) {
			$started = $deployment->Created;
			$startedNice = $deployment->obj('Created')->Nice();
			$startedAgo = $deployment->obj('Created')->Ago();
		} else {
			$started = $deployment->DeployStarted;
			$startedNice = $deployment->obj('DeployStarted')->Nice();
			$startedAgo = $deployment->obj('DeployStarted')->Ago();
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

		$type = 'full';
		if ($deployment->getDeploymentStrategy()->getActionCode() === 'fast') {
			$type = 'code-only';
		}

		return [
			'id' => $deployment->ID,
			'date_created' => $deployment->Created,
			'date_created_nice' => $deployment->obj('Created')->Nice(),
			'date_created_ago' => $deployment->obj('Created')->Ago(),
			'date_started' => $started,
			'date_started_nice' => $startedNice,
			'date_started_ago' => $startedAgo,
			'date_requested' => $deployment->DeployRequested,
			'date_requested_nice' => $deployment->obj('DeployRequested')->Nice(),
			'date_requested_ago' => $deployment->obj('DeployRequested')->Ago(),
			'date_updated' => $deployment->LastEdited,
			'date_updated_nice' => $deployment->obj('LastEdited')->Nice(),
			'date_updated_ago' => $deployment->obj('LastEdited')->Ago(),
			'title' => $deployment->Title,
			'summary' => $deployment->Summary,
			'ref_type' => $deployment->RefType,
			'ref_name' => $deployment->RefName,
			'rejected_reason' => $deployment->RejectedReason ?: '',
			'tags' => $tags,
			'changes' => $deployment->getDeploymentStrategy()->getChanges(),
			'deployment_type' => $type,
			'deployment_estimate' => $deployment->getDeploymentStrategy()->getEstimatedTime(),
			'sha' => $deployment->SHA,
			'short_sha' => substr($deployment->SHA, 0, 7),
			'options' => $options,
			'commit_subject' => $deployment->getCommitSubjectMessage(),
			'commit_message' => $deployment->getCommitMessage(),
			'commit_url' => $deployment->getCommitURL(),
			'deployer' => $deployerData,
			'approver_id' => $deployment->ApproverID ?: '',
			'approver' => $approverData,
			'state' => $deployment->State,
			'is_current_build' => $isCurrentBuild,
			'dirty' => false,
		];
	}

	/**
	 * Return data about a particular {@link Member} of the stack for use in API response.

	 * Notes:
	 * 1) This method returns null instead of an array if the member doesn't exists anymore
	 * 2) 'role' can be null in the response. This is the case of an admin, or an operations
	 * user who can create the deployment but is not part of the stack roles.
	 *
	 * @param \DNProject $project
	 * @param int $memberID
	 * @return null|array
	 */
	public function getStackMemberData(\DNProject $project, $memberID) {
		if (!$project->hasMethod('listMembers')) {
			return null;
		}

		if (empty(self::$_cache_project_members[$project->ID])) {
			self::$_cache_project_members[$project->ID] = $project->listMembers();
		}

		// we cache all member lookup, even the false results
		if (!isset(self::$_cache_members[$memberID])) {
			self::$_cache_members[$memberID] = \Member::get()->byId($memberID);
		}
		if(!self::$_cache_members[$memberID]) {
			return null;
		}

		$role = null;
		foreach (self::$_cache_project_members[$project->ID] as $stackMember) {
			if ($stackMember['MemberID'] !== $memberID) {
				continue;
			}
			$role = $stackMember['RoleTitle'];
		}

		// if an administator is approving, they should be shown as one
		if ($role === null && \Permission::checkMember(self::$_cache_members[$memberID], 'ADMIN')) {
			$role = 'Administrator';
		}

		return [
			'id' => $memberID,
			'email' => self::$_cache_members[$memberID]->Email,
			'role' => $role,
			'name' => self::$_cache_members[$memberID]->getName()
		];
	}

}
