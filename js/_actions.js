// polyfills
require('babel-polyfill');
var fetch = require('isomorphic-fetch');

// checks if a response from fetch worked
function checkStatus(response) {
	if (response.status >= 200 && response.status < 300) {
		return response;
	}
	var error = new Error(response.statusText);
	error.response = response;
	throw error;
}

export const SET_MESSAGE = "SET_MESSAGE";
export function setError(errorMessage) {
	return {
		type: SET_MESSAGE,
		message: errorMessage,
		message_type: "error"
	};
}

export const SET_API_ENDPOINT = "SET_API_ENDPOINT";
export function setAPIEndpoint(url) {
	return {type: SET_API_ENDPOINT, url: url};
}

export const SET_ACTIVE_STEP = "SET_ACTIVE_STEP";
export function setActiveStep(id) {
	return {type: SET_ACTIVE_STEP, id};
}

export const START_GIT_UPDATE = 'START_GIT_UPDATE';
export function startGitUpdate() {
	return {
		type: START_GIT_UPDATE
	};
}

export const FAIL_GIT_UPDATE = 'FAIL_GIT_UPDATE';
export function failGitUpdate(message) {
	return {
		type: FAIL_GIT_UPDATE,
		message: message
	};
}

export const SUCCEED_GIT_UPDATE = 'SUCCEED_GIT_UPDATE';
export function SucceedGitUpdate(json) {
	return {
		type: SUCCEED_GIT_UPDATE,
		list: json.map(child => child),
		receivedAt: Date.now()
	};
}

export function updateGit() {
	// Thunk middleware knows how to handle functions. It passes the dispatch
	// method as an argument to the function, thus making it able to dispatch
	// actions itself.
	return function(dispatch, getState) {
		// First dispatch: the app state is updated to inform that the API call is starting.
		dispatch(startGitUpdate());

		// The function called by the thunk middleware can return a value,
		// that is passed on as the return value of the dispatch method.
		// In this case, we return a promise to wait for.
		// This is not required by thunk middleware, but it is convenient for us.
		return fetch(`${getState().api_endpoint}/gitrefs`, {
			credentials: 'same-origin', // send cookies
			method: 'get'
		})
			.then(checkStatus)
			.then(response => response.json())
			// We can dispatch many times!
			// Here, we update the app state with the results of the API call.
			.then(json => dispatch(SucceedGitUpdate(json)))
			.catch(function setFetchError(err) {
				dispatch(failGitUpdate(err.toString()));
			});
	};
}

export function updateGitIfNeeded() {
	// Note that the function also receives getState() which lets you choose
	// what to dispatch next. This is useful for avoiding a network request if
	// a cached value is already available.
	return (dispatch, getState) => {
		if(!getState().git.length) {
			// Dispatch a thunk from thunk!
			return dispatch(updateGit());
		}
		// Let the calling code know there's nothing to wait for.
		return Promise.resolve();
	};
}

export const SET_GIT_REF_TYPE = "SET_GIT_REF_TYPE";
export function setGitRefType(id) {
	return {type: SET_GIT_REF_TYPE, id};
}

export const SET_GIT_REF = "SET_GIT_REF";
export function setGitRef(id) {
	return {type: SET_GIT_REF, id};
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
	// Thunk middleware knows how to handle functions. It passes the dispatch
	// method as an argument to the function, thus making it able to dispatch
	// actions itself.
	return function(dispatch, getState) {
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
