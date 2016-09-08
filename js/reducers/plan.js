var _ = require('underscore');

var actions = require('../_actions.js');

module.exports = function plan(state, action) {
	if (typeof state === 'undefined') {
		return {
			is_loading: false,
			deployment_type: "",
			deployment_estimate: "",
			changes: {},
			validation_code: "",
			summary_of_changes: "" // fixup
		};
	}

	switch (action.type) {
		case actions.START_SUMMARY_GET:
			return _.assign({}, state, {
				deployment_type: "",
				deployment_estimate: "",
				is_loading: true,
				validation_code: "",
				changes: {}
			});

		case actions.SUCCEED_DEPLOYMENT_GET:
			return _.assign({}, state, {
				is_loading: false,
				changes: action.data.deployment.changes,
				summary_of_changes: action.data.deployment.summary,
				validation_code: "success"
			});

		case actions.SUCCEED_SUMMARY_GET:
			var changes = {};
			// backend can sometimes return an empty array instead of an object
			if (action.summary.changes.length !== 0) {
				changes = action.summary.changes;
			}
			return _.assign({}, state, {
				deployment_type: action.summary.actionCode || "",
				deployment_estimate: action.summary.estimatedTime || "",
				is_loading: false,
				changes: changes,
				validation_code: action.summary.validationCode
			});

		case actions.FAIL_SUMMARY_GET:
			return _.assign({}, state, {
				is_loading: false
			});

		case actions.SET_SUMMARY:
			return _.assign({}, state, {
				summary_of_changes: action.text
			});

		case actions.SUCCEED_REVISIONS_GET:
			return _.assign({}, state, {
				deployment_type: "",
				deployment_estimate: "",
				is_loading: false,
				changes: {}
			});
		default:
			return state;
	}
};
