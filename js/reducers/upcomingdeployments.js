var _ = require('underscore');

var actions = require('../_actions.js');

module.exports = function upcomingdeployments(state, action) {
	if (typeof state === 'undefined') {
		return {
			list: [],
			is_loading: false,
			error: null
		};
	}

	switch (action.type) {
		case actions.START_UPCOMING_DEPLOYMENTS_GET:
			return _.assign({}, state, {
				is_loading: true,
				error: null
			});
		case actions.FAIL_UPCOMING_DEPLOYMENTS_GET:
			return _.assign({}, state, {
				is_loading: false,
				error: action.error.toString()
			});
		case actions.SUCCEED_UPCOMING_DEPLOYMENTS_GET:
			return _.assign({}, state, {
				list: action.data.list,
				is_loading: false
			});
		default:
			return state;
	}
};
