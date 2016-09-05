var _ = require('underscore');

var actions = require('../_actions.js');

module.exports = function deployhistory(state, action) {
	if(typeof state === 'undefined') {
		return {
			data: [],
			is_loading: false
		};
	}

	switch (action.type) {
		case actions.START_DEPLOY_HISTORY_GET:
			return _.assign({}, state, {
				data: [],
				is_loading: true
			});
		case actions.SUCCEED_DEPLOY_HISTORY_GET:
			return _.assign({}, state, {
				data: action.data.history,
				is_loading: false
			});
		default:
			return state;
	}
};
