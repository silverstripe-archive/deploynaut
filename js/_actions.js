// polyfills
require('babel-polyfill');

var webAPI = require('./_api.js');

const api = webAPI.create('plan');

export const SET_ACTIVE_STEP = "SET_ACTIVE_STEP";
export function setActiveStep(id) {
	return {type: SET_ACTIVE_STEP, id};
}

export const START_REPO_UPDATE = 'START_REPO_UPDATE';
export function startRepoUpdate() {
	return {
		type: START_REPO_UPDATE
	};
}

export const SUCCEED_REPO_UPDATE = 'SUCCEED_REPO_UPDATE';
export function succeedRepoUpdate() {
	return {
		type: SUCCEED_REPO_UPDATE,
		receivedAt: Date.now()
	};
}

export const FAIL_REPO_UPDATE = 'FAIL_REPO_UPDATE';
export function failRepoUpdate(err) {
	return {
		type: FAIL_REPO_UPDATE,
		error: err
	};
}

export const START_REVISIONS_GET = 'START_REVISIONS_GET';
export function startRevisionGet() {
	return {
		type: START_REVISIONS_GET
	};
}

export const SUCCEED_REVISIONS_GET = 'SUCCEED_REVISIONS_GET';
export function succeedRevisionsGet(revisions) {
	return {
		type: SUCCEED_REVISIONS_GET,
		list: revisions
	};
}

export const FAIL_REVISIONS_GET = 'FAIL_REVISIONS_GET';
export function failRevisionsGet(err) {
	return {
		type: FAIL_REVISIONS_GET,
		error: err
	};
}

export function getRevisions() {
	return (dispatch, getState) => {
		dispatch(startRevisionGet());
		return api.call(dispatch, getState, '/gitrefs', 'get')
			.then(json => dispatch(succeedRevisionsGet(json)))
			.catch(err => dispatch(failRevisionsGet(err)));
	};
}

export function getRevisionsIfNeeded() {
	return (dispatch, getState) => {
		if(!getState().git.length) {
			dispatch(getRevisions());
		}
	};
}

export function updateRepo() {
	return (dispatch, getState) => {
		dispatch(startRepoUpdate());
		api.call(dispatch, getState, 'gitupdate', 'post')
			.then(data => api.waitForSuccess(dispatch, getState, data.message.href))
			.then(() => dispatch(succeedRepoUpdate()))
			.catch(err => dispatch(failRepoUpdate(err)));
	};
}

// combines the updateRepo and revisionGet actions in one call
export function updateRepoAndGetRevisions() {
	return (dispatch, getState) => {
		dispatch(startRepoUpdate());
		api.call(dispatch, getState, 'gitupdate', 'post')
			.then(data => api.waitForSuccess(dispatch, getState, data.href))
			.then(() => dispatch(succeedRepoUpdate()))
			.catch(err => dispatch(failRepoUpdate(err)))
			.then(() => dispatch(startRevisionGet()))
			.then(function() {
				return api.call(dispatch, getState, '/gitrefs', 'get')
					.then(json => dispatch(succeedRevisionsGet(json)))
					.catch(err => dispatch(failRevisionsGet(err)));
			});
	};
}

export const SET_REVISION_TYPE = "SET_REVISION_TYPE";
export function setGitRefType(id) {
	return {type: SET_REVISION_TYPE, id};
}

export const SET_REVISION = "SET_REVISION";
export function setGitRef(id) {
	return {type: SET_REVISION, id};
}

export const START_SUMMARY_GET = 'START_SUMMARY_GET';
export function startSummaryGet() {
	return {
		type: START_SUMMARY_GET
	};
}

export const SUCCEED_SUMMARY_GET = 'SUCCEED_SUMMARY_GET';
export function succeedSummaryGet(json) {
	return {
		type: SUCCEED_SUMMARY_GET,
		summary: json,
		receivedAt: Date.now()
	};
}

export const FAIL_SUMMARY_GET = 'FAIL_SUMMARY_GET';
export function failSummaryGet(err) {
	return {
		type: FAIL_SUMMARY_GET,
		error: err
	};
}

export function getDeploySummary(gitSHA) {
	return (dispatch, getState) => {
		dispatch(startSummaryGet());
		return api.call(dispatch, getState, '/deploysummary', 'post', {sha: gitSHA})
			.then(data => dispatch(succeedSummaryGet(data)))
			.catch(err => dispatch(failSummaryGet(err)));
	};
}

export const SET_SUMMARY = "SET_SUMMARY";
export function setSummary(text) {
	return {type: SET_SUMMARY, text};
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
