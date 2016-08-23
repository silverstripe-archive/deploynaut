var _ = require('underscore');

var actions = require('../_actions.js');

module.exports = function environment(state, action) {
	if(typeof state === 'undefined') {
		return {
			name: ""
		};
	}
	switch(action.type) {
		default:
			return state;
	}
};
