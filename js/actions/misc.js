// polyfills
require('babel-polyfill');

// this file contains actions that currently
// 1. doesn't do any backend stuff
// 2. haven't been moved into their own file

export const SET_ACTIVE_STEP = "SET_ACTIVE_STEP";
export function setActiveStep(id) {
	return {type: SET_ACTIVE_STEP, id};
}

export const SET_APPROVER = "SET_APPROVER";
export function setApprover(id) {
	return {type: SET_APPROVER, id};
}

export const START_APPROVAL_SUBMIT = "START_APPROVAL_SUBMIT";
export function startApprovalSubmit() {
	return {type: START_APPROVAL_SUBMIT};
}

export const SUCCEED_APPROVAL_SUBMIT = "SUCCEED_APPROVAL_SUBMIT";
export function succeedApprovalSubmit() {
	return {type: SUCCEED_APPROVAL_SUBMIT};
}

export const FAIL_APPROVAL_SUBMIT = "FAIL_APPROVAL_SUBMIT";
export function failApprovalSubmit() {
	return {type: FAIL_APPROVAL_SUBMIT};
}

export function submitForApproval() {
	return function(dispatch) {
		dispatch(startApprovalSubmit());
		dispatch(succeedApprovalSubmit());
	};
}

export const START_APPROVAL_CANCEL = "START_APPROVAL_CANCEL";
export function startApprovalCancel() {
	return {type: START_APPROVAL_CANCEL};
}

export const SUCCEED_APPROVAL_CANCEL = "SUCCEED_APPROVAL_CANCEL";
export function succeedApprovalCancel() {
	return {type: SUCCEED_APPROVAL_CANCEL};
}

export const FAIL_APPROVAL_CANCEL = "FAIL_APPROVAL_CANCEL";
export function failApprovalCancel() {
	return {type: FAIL_APPROVAL_CANCEL};
}

export const START_APPROVAL_APROVE = "START_APPROVAL_APROVE";
export function startApprovalAprove() {
	return {type: START_APPROVAL_APROVE};
}

export const SUCCEED_APPROVAL_APROVE = "SUCCEED_APPROVAL_APROVE";
export function succeedApprovalAprove() {
	return {type: SUCCEED_APPROVAL_APROVE};
}

export const FAIL_APPROVAL_APROVE = "FAIL_APPROVAL_APROVE";
export function failApprovalAprove() {
	return {type: FAIL_APPROVAL_APROVE};
}

export const START_APPROVAL_REJECT = "START_APPROVAL_REJECT";
export function startApprovalReject() {
	return {type: START_APPROVAL_REJECT};
}

export const SUCCEED_APPROVAL_REJECT = "SUCCEED_APPROVAL_REJECT";
export function succeedApprovalReject() {
	return {type: START_APPROVAL_REJECT};
}

export const FAIL_APPROVAL_REJECT = "FAIL_APPROVAL_REJECT";
export function failApprovalReject() {
	return {type: FAIL_APPROVAL_REJECT};
}

export const START_APPROVAL_BYPASS = "START_APPROVAL_BYPASS";
export function startApprovalBypass() {
	return {type: START_APPROVAL_BYPASS};
}

export const SUCCEED_APPROVAL_BYPASS = "SUCCEED_APPROVAL_BYPASS";
export function succeedApprovalBypass() {
	return {type: SUCCEED_APPROVAL_BYPASS};
}

export const FAIL_APPROVAL_BYPASS = "FAIL_APPROVAL_BYPASS";
export function failApprovalBypass() {
	return {type: FAIL_APPROVAL_BYPASS};
}

export function bypassApproval() {
	return (dispatch) => {
		dispatch(startApprovalBypass());
		dispatch(succeedApprovalBypass());
	};
}

export const START_DEPLOYMENT_ENQUEUE = "START_DEPLOYMENT_ENQUEUE";
export function startDeploymentEnqueue() {
	return {type: START_DEPLOYMENT_ENQUEUE};
}

export const SUCCEED_DEPLOYMENT_ENQUEUE = "SUCCEED_DEPLOYMENT_ENQUEUE";
export function succeedDeploymentEnqueue() {
	return {type: SUCCEED_DEPLOYMENT_ENQUEUE};
}

export const FAIL_DEPLOYMENT_ENQUEUE = "FAIL_DEPLOYMENT_ENQUEUE";
export function failDeploymentEnqueue() {
	return {type: FAIL_DEPLOYMENT_ENQUEUE};
}
