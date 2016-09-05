var _ = require('underscore');

var git = require('../actions/git.js');

module.exports = function (state, action) {
	if(typeof state === 'undefined') {
		return {
			selected_type: "",
			selected_ref: "",
			is_fetching: false,
			is_updating: false,
			last_updated: 0,
			list: []
		};
	}
	switch(action.type) {
		case git.SET_REVISION_TYPE:
			return _.assign({}, state, {
				selected_type: action.id,
				selected_ref: ""
			});
		case git.SET_REVISION:
			return _.assign({}, state, {
				selected_ref: action.id
			});
		case git.START_REPO_UPDATE:
			return _.assign({}, state, {
				is_updating: true
			});

		case git.SUCCEED_REPO_UPDATE:
			return _.assign({}, state, {
				is_updating: false,
				last_updated: action.receivedAt
			});

		case git.FAIL_REPO_UPDATE:
			return _.assign({}, state, {
				is_updating: false
			});

		case git.START_REVISIONS_GET:
			return _.assign({}, state, {
				is_fetching: true
			});

		case git.SUCCEED_REVISIONS_GET:
			return _.assign({}, state, {
				is_fetching: false,
				list: action.list.refs,
				last_updated: action.receivedAt,
				selected_type: "",
				selected_ref: ""
			});

		case git.FAIL_REVISIONS_GET:
			return _.assign({}, state, {
				is_fetching: false
			});

		default:
			return state;
	}
};
