const _ = require('underscore');

const actions = require('../_actions.js');

module.exports = function navigation(state, action) {
	if (typeof state === 'undefined') {
		return {
			open: false,
			active: 0
		};
	}
	switch (action.type) {
		case actions.NEW_DEPLOYMENT:
			return _.assign({}, state, {
				active: 0
			});
		case actions.SET_OPEN_DIALOG:
			return _.assign({}, state, {
				open: true
			});
		case actions.SET_CLOSE_DIALOG:
			return _.assign({}, state, {
				open: false
			});
		case actions.SET_ACTIVE_STEP:
			return _.assign({}, state, {
				active: action.id
			});
		default:
			return state;
	}
};
