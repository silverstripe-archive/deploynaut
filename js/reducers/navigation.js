var _ = require('underscore');

var actions = require('../_actions.js');

module.exports = function navigation(state, action) {
	if(typeof state === 'undefined') {
		return {
			active: 0
		};
	}
	switch(action.type) {
		case actions.SET_ACTIVE_STEP:
			return _.assign({}, state, {
				active: action.id
			});
		default:
			return state;
	}
};
