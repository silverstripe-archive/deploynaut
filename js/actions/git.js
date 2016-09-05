// polyfills
require('babel-polyfill');
const webAPI = require('../_api.js');

// create an api that uses the 'git' dispatcher
const api = webAPI.create('git');

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
		return api.call(dispatch, getState, '/show', 'get')
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
		api.call(dispatch, getState, '/update', 'post')
			.then(data => api.waitForSuccess(dispatch, getState, data.message.href))
			.then(() => dispatch(succeedRepoUpdate()))
			.catch(err => dispatch(failRepoUpdate(err)));
	};
}

// combines the updateRepo and revisionGet actions in one call
export function updateRepoAndGetRevisions() {
	return (dispatch, getState) => {
		dispatch(startRepoUpdate());
		api.call(dispatch, getState, '/update', 'post')
			.then(data => api.waitForSuccess(dispatch, getState, data.href))
			.then(() => dispatch(succeedRepoUpdate()))
			.catch(err => dispatch(failRepoUpdate(err)))
			.then(() => dispatch(startRevisionGet()))
			.then(function() {
				return api.call(dispatch, getState, '/show', 'get')
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

