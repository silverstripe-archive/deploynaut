// This is a copy of the states of a DNDeployment
export const STATE_NEW = 'New';
export const STATE_SUBMITTED = 'Submitted';
export const STATE_INVALID = 'Invalid';
export const STATE_APPROVED = 'Approved';
export const STATE_REJECTED = 'Rejected';
export const STATE_QUEUED = 'Queued';
export const STATE_DEPLOYING = 'Deploying';
export const STATE_ABORTING = 'Aborting';
export const STATE_COMPLETED = 'Completed';
export const STATE_FAILED = 'Failed';

export function hasLogs(deployState) {
	if (deployState === STATE_NEW) {
		return false;
	}
	if (deployState === STATE_SUBMITTED) {
		return false;
	}
	if (deployState === STATE_INVALID) {
		return false;
	}
	return true;
}

export function isDeploying(deployState) {
	if (deployState === STATE_QUEUED) {
		return true;
	}
	if (deployState === STATE_DEPLOYING) {
		return true;
	}
	if (deployState === STATE_ABORTING) {
		return true;
	}
	return false;
}

export function isDeployDone(deployState) {
	if (deployState === STATE_COMPLETED) {
		return true;
	}
	if (deployState === STATE_FAILED) {
		return true;
	}
	return false;
}

export function hasDeployStarted(deployState) {
	return isDeployDone(deployState) || isDeploying(deployState);
}

export function isSubmitted(deployState) {
	return deployState === STATE_SUBMITTED;
}

export function isApproved(deployState) {
	if (hasDeployStarted(deployState)) {
		return true;
	}
	if (deployState === STATE_APPROVED) {
		return true;
	}
	return false;
}

export function isRejected(deployState) {
	return deployState === STATE_REJECTED;
}

export function canDelete(state) {
	if (hasDeployStarted(state)) {
		return false;
	}
	return true;
}

export function canEdit(state) {
	if (state.deployment.submitted) {
		return false;
	}
	if (state.deployment.approved) {
		return false;
	}
	if (state.deployment.queued) {
		return false;
	}
	return true;
}
