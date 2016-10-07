// polyfills
require('babel-polyfill');
const api = require('./_api.js');
const constants = require('./constants/deployment.js');

const gitAPI = api.create('git');
const planAPI = api.create('plan');
const deployAPI = api.create('deploys');
const approvalsAPI = api.create('approvals');

// allows history to be accessed throughout the project, this will be set
// when the store is configured in EnvironmentOverview.jsx
export const history = null;

export const SET_ENVIRONMENT = 'SET_ENVIRONMENT';
export function setEnvironment(data) {
	return {
		type: SET_ENVIRONMENT,
		data: data
	};
}

export const SET_USER = 'SET_USER';
export function setUser(data) {
	return {
		type: SET_USER,
		data: data
	};
}

export const NEW_DEPLOYMENT = "NEW_DEPLOYMENT";
export function newDeployment() {
	return {type: NEW_DEPLOYMENT};
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
		received_at: Date.now()
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

export const START_UPCOMING_DEPLOYMENTS_GET = 'START_UPCOMING_DEPLOYMENTS_GET';
export function startUpcomingDeploymentsGet() {
	return {
		type: START_UPCOMING_DEPLOYMENTS_GET
	};
}

export const SUCCEED_UPCOMING_DEPLOYMENTS_GET = 'SUCCEED_UPCOMING_DEPLOYMENTS_GET';
export function succeedUpcomingDeploymentsGet(data) {
	return {
		type: SUCCEED_UPCOMING_DEPLOYMENTS_GET,
		data: data
	};
}

export const FAIL_UPCOMING_DEPLOYMENTS_GET = 'FAIL_UPCOMING_DEPLOYMENTS_GET';
export function failUpcomingDeploymentsGet(err) {
	return {
		type: FAIL_UPCOMING_DEPLOYMENTS_GET,
		error: err
	};
}

export const START_DEPLOY_HISTORY_GET = 'START_DEPLOY_HISTORY_GET';
export function startDeployHistoryGet() {
	return {
		type: START_DEPLOY_HISTORY_GET
	};
}

export const SUCCEED_DEPLOY_HISTORY_GET = 'SUCCEED_DEPLOY_HISTORY_GET';
export function succeedDeployHistoryGet(data) {
	return {
		type: SUCCEED_DEPLOY_HISTORY_GET,
		data: data
	};
}

export const FAIL_DEPLOY_HISTORY_GET = 'FAIL_DEPLOY_HISTORY_GET';
export function failDeployHistoryGet(err) {
	return {
		type: FAIL_DEPLOY_HISTORY_GET,
		error: err
	};
}

export const SET_DEPLOY_HISTORY_PAGE = 'SET_DEPLOY_HISTORY_PAGE';
export function setDeployHistoryPage(page) {
	let selected_page = 1;
	if (typeof page !== 'undefined') {
		selected_page = page;
	}

	return {
		type: SET_DEPLOY_HISTORY_PAGE,
		page: selected_page
	};
}

export function getRevisions() {
	return (dispatch, getState) => {
		dispatch(startRevisionGet());
		return gitAPI.call(getState, `/show?environmentId=${getState().environment.id}`, 'get')
			.then(json => dispatch(succeedRevisionsGet(json)))
			.catch(err => dispatch(failRevisionsGet(err)));
	};
}

export function getDeployHistory() {
	return (dispatch, getState) => {
		dispatch(startDeployHistoryGet());
		return deployAPI.call(getState, '/history', 'get')
			.then(json => dispatch(succeedDeployHistoryGet(json)))
			.catch(err => dispatch(failDeployHistoryGet(err)));
	};
}

export function getUpcomingDeployments() {
	return (dispatch, getState) => {
		dispatch(startUpcomingDeploymentsGet());
		return deployAPI.call(getState, '/upcoming', 'get')
			.then(json => dispatch(succeedUpcomingDeploymentsGet(json)))
			.catch(err => dispatch(failUpcomingDeploymentsGet(err)));
	};
}

export function getRevisionsIfNeeded() {
	return (dispatch, getState) => {
		if (!getState().git.length) {
			dispatch(getRevisions());
		}
	};
}

// combines the updateRepo and revisionGet actions in one call
export function updateRepoAndGetRevisions() {
	return (dispatch, getState) => {
		dispatch(startRepoUpdate());
		return gitAPI.call(getState, '/update', 'post')
			.then(data => gitAPI.waitForSuccess(getState, `/update/${data.id}`))
			.then(() => dispatch(succeedRepoUpdate()))
			.catch(err => dispatch(failRepoUpdate(err)))
			.then(() => dispatch(startRevisionGet()))
			.then(() => gitAPI.call(getState, `/show?environmentId=${getState().environment.id}`, 'get'))
			.then(json => dispatch(succeedRevisionsGet(json)))
			.catch(err => dispatch(failRevisionsGet(err)));
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
		received_at: Date.now()
	};
}

export const FAIL_SUMMARY_GET = 'FAIL_SUMMARY_GET';
export function failSummaryGet(err) {
	return {
		type: FAIL_SUMMARY_GET,
		error: err
	};
}

export function getDeploySummary(sha) {
	return (dispatch, getState) => {
		dispatch(startSummaryGet());
		return planAPI.call(getState, '/deploysummary', 'post', {sha: sha})
			.then(data => dispatch(succeedSummaryGet(data)))
			.catch(err => dispatch(failSummaryGet(err)));
	};
}

export const SET_TITLE = "SET_TITLE";
export function setTitle(text) {
	return {type: SET_TITLE, text};
}

export const SET_SUMMARY = "SET_SUMMARY";
export function setSummary(text) {
	return {type: SET_SUMMARY, text};
}

export const START_APPROVERS_GET = 'START_APPROVERS_GET';
export function startApproversGet() {
	return {type: START_APPROVERS_GET};
}
export const SUCCEED_APPROVERS_GET = 'SUCCEED_APPROVERS_GET';
export function succeedApproversGet(data) {
	return {
		type: SUCCEED_APPROVERS_GET,
		data: data
	};
}
export const FAIL_APPROVERS_GET = 'FAIL_APPROVERS_GET';
export function failApproversGet(err) {
	return {
		type: FAIL_APPROVERS_GET,
		error: err
	};
}
export function getApprovers() {
	return (dispatch, getState) => {
		dispatch(startApproversGet());
		return approvalsAPI.call(getState, '/approvers', 'get')
			.then(json => dispatch(succeedApproversGet(json)))
			.catch(err => dispatch(failApproversGet(err)));
	};
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
export function succeedApprovalSubmit(data) {
	return {
		type: SUCCEED_APPROVAL_SUBMIT,
		data: data
	};
}

export const FAIL_APPROVAL_SUBMIT = "FAIL_APPROVAL_SUBMIT";
export function failApprovalSubmit(err) {
	return {
		type: FAIL_APPROVAL_SUBMIT,
		error: err
	};
}

export function submitForApproval() {
	return (dispatch, getState) => {
		dispatch(startApprovalSubmit());
		return approvalsAPI.call(getState, '/submit', 'post', {
			id: getState().deployment.id,
			approver_id: getState().deployment.approver_id
		})
			.then(function(data) {
				dispatch(succeedApprovalSubmit(data));
			})
			.catch((error) => dispatch(failApprovalSubmit(error)));
	};
}

export const START_APPROVAL_CANCEL = "START_APPROVAL_CANCEL";
export function startApprovalCancel() {
	return {type: START_APPROVAL_CANCEL};
}

export const SUCCEED_APPROVAL_CANCEL = "SUCCEED_APPROVAL_CANCEL";
export function succeedApprovalCancel(data) {
	return {
		type: SUCCEED_APPROVAL_CANCEL,
		data: data
	};
}

export const FAIL_APPROVAL_CANCEL = "FAIL_APPROVAL_CANCEL";
export function failApprovalCancel(err) {
	return {
		type: FAIL_APPROVAL_CANCEL,
		error: err
	};
}

export function cancelApprovalRequest() {
	return (dispatch, getState) => {
		dispatch(startApprovalCancel());
		return approvalsAPI.call(getState, '/cancel', 'post', {
			id: getState().deployment.id
		})
			.then(function(data) {
				dispatch(succeedApprovalCancel(data));
			})
			.catch((error) => dispatch(failApprovalCancel(error)));
	};
}

export const START_APPROVAL_APPROVE = "START_APPROVAL_APPROVE";
export function startApprovalApprove() {
	return {type: START_APPROVAL_APPROVE};
}

export const SUCCEED_APPROVAL_APPROVE = "SUCCEED_APPROVAL_APPROVE";
export function succeedApprovalApprove(data) {
	return {
		type: SUCCEED_APPROVAL_APPROVE,
		data: data
	};
}

export const FAIL_APPROVAL_APPROVE = "FAIL_APPROVAL_APPROVE";
export function failApprovalApprove(err) {
	return {
		type: FAIL_APPROVAL_APPROVE,
		error: err
	};
}

export function approveDeployment() {
	return (dispatch, getState) => {
		dispatch(startApprovalApprove());
		return approvalsAPI.call(getState, '/approve', 'post', {
			id: getState().deployment.id
		})
			.then(function(data) {
				dispatch(succeedApprovalApprove(data));
			})
			.catch((error) => dispatch(failApprovalApprove(error)));
	};
}

export const START_APPROVAL_REJECT = "START_APPROVAL_REJECT";
export function startApprovalReject() {
	return {type: START_APPROVAL_REJECT};
}

export const SUCCEED_APPROVAL_REJECT = "SUCCEED_APPROVAL_REJECT";
export function succeedApprovalReject(data) {
	return {
		type: START_APPROVAL_REJECT,
		data: data
	};
}

export const FAIL_APPROVAL_REJECT = "FAIL_APPROVAL_REJECT";
export function failApprovalReject(err) {
	return {
		type: FAIL_APPROVAL_REJECT,
		error: err
	};
}

export function rejectDeployment() {
	return (dispatch, getState) => {
		dispatch(startApprovalReject());
		return approvalsAPI.call(getState, '/reject', 'post', {
			id: getState().deployment.id
		})
			.then(function(data) {
				dispatch(succeedApprovalReject(data));
			})
			.catch((error) => dispatch(failApprovalReject(error)));
	};
}

export const START_DEPLOYMENT_CREATE = "START_DEPLOYMENT_CREATE";
export function startDeploymentCreate() {
	return {type: START_DEPLOYMENT_CREATE};
}

export const SUCCEED_DEPLOYMENT_CREATE = "SUCCEED_DEPLOYMENT_CREATE";
export function succeedDeploymentCreate(data) {
	return {
		type: SUCCEED_DEPLOYMENT_CREATE,
		data: data
	};
}

export const FAIL_DEPLOYMENT_CREATE = "FAIL_DEPLOYMENT_CREATE";
export function failDeploymentCreate(err) {
	return {
		type: FAIL_DEPLOYMENT_CREATE,
		error: err
	};
}

export function createDeployment() {
	return (dispatch, getState) => {
		if (getState().deployment.id) {
			return Promise.resolve();
		}

		dispatch(startDeploymentCreate());
		return deployAPI.call(getState, '/createdeployment', 'post', {
			ref: getState().git.selected_ref,
			ref_type: getState().git.selected_type,
			ref_name: getState().git.selected_name,
			title: getState().plan.title,
			summary: getState().plan.summary_of_changes,
			approver_id: getState().deployment.approver_id
		})
			.then(function(data) {
				return dispatch(succeedDeploymentCreate(data));
			})
			.catch((error) => dispatch(failDeploymentCreate(error)));
	};
}

export const START_DEPLOYMENT_QUEUE = "START_DEPLOYMENT_QUEUE";
export function startDeploymentEnqueue() {
	return {type: START_DEPLOYMENT_QUEUE};
}

export const SUCCEED_DEPLOYMENT_QUEUE = "SUCCEED_DEPLOYMENT_QUEUE";
export function succeedDeploymentEnqueue(data) {
	return {
		type: SUCCEED_DEPLOYMENT_QUEUE,
		data: data
	};
}

export const FAIL_DEPLOYMENT_QUEUE = "FAIL_DEPLOYMENT_QUEUE";
export function failDeploymentEnqueue(err) {
	return {
		type: FAIL_DEPLOYMENT_QUEUE,
		error: err
	};
}

export const SUCCEED_DEPLOY_LOG_UPDATE = 'SUCCEED_DEPLOY_LOG_UPDATE';
export function succeedDeployLogUpdate(data) {
	return {
		type: SUCCEED_DEPLOY_LOG_UPDATE,
		data: data
	};
}

export const FAIL_DEPLOY_LOG_UPDATE = 'FAIL_DEPLOY_LOG_UPDATE';
export function failDeployLogUpdate(err) {
	return {
		type: FAIL_DEPLOY_LOG_UPDATE,
		error: err
	};
}

export function getDeployLog() {
	return (dispatch, getState) => {
		const currentState = getState().deployment.list[getState().deployment.id].state;
		if (!constants.hasLogs(currentState)) {
			return;
		}
		deployAPI.waitForSuccess(getState, `/log/${getState().deployment.id}`, 100, function(data) {
			dispatch(succeedDeployLogUpdate(data));
		});
	};
}

export function startDeploy() {
	return (dispatch, getState) => {
		dispatch(startDeploymentEnqueue());
		return deployAPI.call(getState, '/start', 'post', {
			id: getState().deployment.id
		})
			.then(function(data) {
				dispatch(succeedDeploymentEnqueue(data));
				return dispatch(getDeployLog());
			})
			.catch((error) => dispatch(failDeploymentEnqueue(error)));
	};
}

export const START_DEPLOYMENT_GET = "START_DEPLOYMENT_GET";
export function startGetDeployment() {
	return {type: START_DEPLOYMENT_GET};
}

export const SUCCEED_DEPLOYMENT_GET = "SUCCEED_DEPLOYMENT_GET";
export function succeedGetDeployment(data) {
	return {
		type: SUCCEED_DEPLOYMENT_GET,
		data: data
	};
}

export const FAIL_DEPLOYMENT_GET = "FAIL_DEPLOYMENT_GET";
export function failGetDeployment(err) {
	return {
		type: FAIL_DEPLOYMENT_QUEUE,
		error: err
	};
}

export function getDeployment(id) {
	return (dispatch, getState) => {
		dispatch(startGetDeployment());

		let getDeployPromise = null;
		if (getState().deployment.list[id]) {
			// we can use the cached value
			getDeployPromise = new Promise(function(resolve) {
				resolve({deployment: getState().deployment.list[id]});
			});
		} else {
			// we need to fetch the deployment from the backend
			getDeployPromise = deployAPI.call(getState, `/show/${id}`, 'get');
		}

		return getDeployPromise
			.then(data => {
				dispatch(succeedGetDeployment(data));
				dispatch(getDeployLog());
			})
			.catch(err => dispatch(failGetDeployment(err)));
	};
}
