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

// These constants are a subset of the deploynaut states
// this is because an approval can be bypassed and also
// several deployment states maps to 'approved'.
export const APPROVAL_SUBMITTED = 'submitted';
export const APPROVAL_REJECTED = 'rejected';
export const APPROVAL_BYPASSED = 'bypassed';
export const APPROVAL_APPROVED = 'approved';

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
	if (deployState === STATE_APPROVED) {
		return false;
	}
	if (deployState === STATE_REJECTED) {
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
	if (state.deployment.rejected) {
		return false;
	}
	return true;
}

// this function maps deployment state to an approval state
export function getApprovalState(deployState, approverName) {
	switch (deployState) {
		case STATE_SUBMITTED:
			return APPROVAL_SUBMITTED;
		case STATE_REJECTED:
			return APPROVAL_REJECTED;
		case STATE_APPROVED:
		case STATE_QUEUED:
		case STATE_DEPLOYING:
		case STATE_INVALID:
		case STATE_FAILED:
		case STATE_COMPLETED:
			if (!approverName) {
				return APPROVAL_BYPASSED
			}
			return APPROVAL_APPROVED;
		default:
			return '';
	}
}
