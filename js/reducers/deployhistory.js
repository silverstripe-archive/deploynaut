var _ = require('underscore');

var actions = require('../_actions.js');

module.exports = function deployhistory(state, action) {
	if(typeof state === 'undefined') {
		return {
			list: [],
			pagelength: 0,
			totalpages: 0,
			currentpage: 0,
			is_loading: false
		};
	}

	switch (action.type) {
		case actions.START_DEPLOY_HISTORY_GET:
			return _.assign({}, state, {
				is_loading: true
			});
		case actions.FAIL_DEPLOY_HISTORY_GET:
			return _.assign({}, state, {
				is_loading: false
			});
		case actions.SUCCEED_DEPLOY_HISTORY_GET:
			return _.assign({}, state, {
				list: action.data.list,
				pagelength: action.data.pagelength,
				totalpages: action.data.totalpages,
				currentpage: action.data.currentpage,
				is_loading: false
			});
		default:
			return state;
	}
};
