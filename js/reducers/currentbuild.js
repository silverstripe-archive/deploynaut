var _ = require('underscore');

var actions = require('../_actions.js');

module.exports = function currentbuild(state, action) {
	if(typeof state === 'undefined') {
		return {
			build: [],
			is_loading: false
		};
	}

	switch (action.type) {
		case actions.START_CURRENT_BUILD_STATUS_GET:
			return _.assign({}, state, {
				is_loading: true
			});
		case actions.FAIL_CURRENT_BUILD_STATUS_GET:
			return _.assign({}, state, {
				is_loading: false
			});
		case actions.SUCCEED_CURRENT_BUILD_STATUS_GET:
			return _.assign({}, state, {
				build: action.data.build,
				is_loading: false
			});
		default:
			return state;
	}
};
