const _ = require('underscore');

const actions = require('../_actions.js');

module.exports = function currentbuild(state, action) {
	if (typeof state === 'undefined') {
		return {
			data: {},
			is_loading: false,
			error: null
		};
	}

	switch (action.type) {
		case actions.START_CURRENT_BUILD_STATUS_GET:
			return _.assign({}, state, {
				is_loading: true,
				error: null
			});
		case actions.FAIL_CURRENT_BUILD_STATUS_GET:
			return _.assign({}, state, {
				is_loading: false,
				error: action.error.toString()
			});
		case actions.SUCCEED_CURRENT_BUILD_STATUS_GET:
			return _.assign({}, state, {
				data: action.data.deployment,
				is_loading: false
			});
		default:
			return state;
	}
};
