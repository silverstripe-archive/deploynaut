var _ = require('underscore');

var actions = require('../_actions.js');

module.exports = function deployment(state, action) {
	if(typeof state === 'undefined') {
		return {
			enqueued: false
		};
	}
	switch(action.type) {
		case actions.START_DEPLOYMENT_ENQUEUE:
			return _.assign({}, state, {
				enqueued: true
			});

		default:
			return state;
	}
};
