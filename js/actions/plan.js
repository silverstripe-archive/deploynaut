// polyfills
require('babel-polyfill');
const webAPI = require('../_api.js');

// create an api that uses the 'plan' dispatcher
const api = webAPI.create('plan');

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
