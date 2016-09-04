var _ = require('underscore');

var actions = require('../_api.js');

module.exports = function api(state, action) {
	if(typeof state === 'undefined') {
		return {};
	}
	switch(action.type) {
		case actions.SET_API: {
			const newstate = _.assign({}, state);
			newstate[action.namespace] = {
				endpoint: action.endpoint,
				auth: action.auth
			};
			return newstate;
		}
		default:
			return state;
	}
};
