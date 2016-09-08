var _ = require('underscore');

var actions = require('../_actions.js');

module.exports = function deployhistory(state, action) {
	if(typeof state === 'undefined') {
		return {
			list: [],
			page_length: 0,
			total_pages: 0,
			current_page: 0,
			is_loading: false,
			error: null
		};
	}

	switch (action.type) {
		case actions.START_DEPLOY_HISTORY_GET:
			return _.assign({}, state, {
				is_loading: true,
				error: null
			});
		case actions.FAIL_DEPLOY_HISTORY_GET:
			return _.assign({}, state, {
				is_loading: false,
				error: action.error.toString()
			});
		case actions.SUCCEED_DEPLOY_HISTORY_GET:
			return _.assign({}, state, {
				list: action.data.list,
				page_length: action.data.page_length,
				total_pages: action.data.total_pages,
				current_page: action.data.current_page,
				is_loading: false
			});
		default:
			return state;
	}
};
