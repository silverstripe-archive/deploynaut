var _ = require('underscore');

var actions = require('../_actions.js');

module.exports = function git(state, action) {
	if (typeof state === 'undefined') {
		return {
			selected_type: "",
			selected_ref: "",
			is_fetching: false,
			is_updating: false,
			last_updated: 0,
			list: []
		};
	}
	switch (action.type) {
		case actions.SET_REVISION_TYPE:
			return _.assign({}, state, {
				selected_type: action.id,
				selected_ref: ""
			});
		case actions.SUCCEED_DEPLOYMENT_GET:
			return _.assign({}, state, {
				selected_ref: action.data.deployment.sha
			});
		case actions.SET_REVISION:
			return _.assign({}, state, {
				selected_ref: action.id
			});
		case actions.START_REPO_UPDATE:
			return _.assign({}, state, {
				is_updating: true
			});

		case actions.SUCCEED_REPO_UPDATE:
			return _.assign({}, state, {
				is_updating: false,
				last_updated: action.received_at
			});

		case actions.FAIL_REPO_UPDATE:
			return _.assign({}, state, {
				is_updating: false
			});

		case actions.START_REVISIONS_GET:
			return _.assign({}, state, {
				is_fetching: true
			});

		case actions.SUCCEED_REVISIONS_GET:
			return _.assign({}, state, {
				is_fetching: false,
				list: action.list.refs,
				last_updated: action.received_at,
				selected_type: "",
				selected_ref: ""
			});

		case actions.FAIL_REVISIONS_GET:
			return _.assign({}, state, {
				is_fetching: false
			});

		default:
			return state;
	}
};
