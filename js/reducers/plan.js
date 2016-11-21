const _ = require('underscore');

const actions = require('../_actions.js');

const initialState = {
	is_loading: false,
	deployment_type: "",
	deployment_estimate: "",
	changes: "",
	validation_code: "",
	title: "",
	summary_of_changes: "",
	messages: []
};

module.exports = function plan(state, action) {
	if (typeof state === 'undefined') {
		return initialState;
	}

	switch (action.type) {
		case actions.NEW_DEPLOYMENT:
		case actions.START_DEPLOYMENT_GET:
		case actions.SET_REVISION:
		case actions.SUCCEED_REPO_UPDATE:
		case actions.TOGGLE_OPTION:
			return initialState;

		case actions.START_SUMMARY_GET:
			_.assign({}, state, initialState);
			return _.assign({}, state, {
				is_loading: true
			});

		case actions.SUCCEED_DEPLOYMENT_GET:
			return _.assign({}, state, {
				is_loading: false,
				changes: action.data.deployment.changes,
				title: action.data.deployment.title || "",
				summary_of_changes: action.data.deployment.summary || "",
				validation_code: "success",
				deployment_type: action.data.deployment.deployment_type,
				deployment_estimate: action.data.deployment.deployment_estimate
			});

		case actions.SUCCEED_SUMMARY_GET: {
			let changes = {};
			// backend can sometimes return an empty array instead of an object
			if (action.summary.changes.length !== 0) {
				changes = action.summary.changes;
			}

			return _.assign({}, state, {
				deployment_type: action.summary.actionCode || "",
				deployment_estimate: action.summary.estimatedTime || "",
				is_loading: false,
				changes: changes,
				validation_code: action.summary.validationCode,
				messages: action.summary.messages
			});
		}
		case actions.FAIL_SUMMARY_GET:
			return _.assign({}, state, {
				is_loading: false
			});

		case actions.SET_TITLE:
			return _.assign({}, state, {
				title: action.text
			});

		case actions.SET_SUMMARY:
			return _.assign({}, state, {
				summary_of_changes: action.text
			});

		default:
			return state;
	}
};
