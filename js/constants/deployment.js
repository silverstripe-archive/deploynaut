// This is a copy of the states of a DNDeployment
export const STATE_NEW = 'New';
export const STATE_SUBMITTED = 'Submitted';
export const STATE_INVALID = 'Invalid';
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
