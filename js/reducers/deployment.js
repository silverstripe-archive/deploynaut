var _ = require('underscore');

var actions = require('../_actions.js');

module.exports = function deployment(state, action) {
	if(typeof state === 'undefined') {
		return {
			enqueued: false,
			ID: "",
			log: [],
			status: ""
		};
	}
	switch(action.type) {
		case actions.START_DEPLOYMENT_ENQUEUE:
			return _.assign({}, state, {
				enqueued: true
			});
		case actions.SUCCEED_DEPLOYMENT_ENQUEUE:
			return _.assign({}, state, {
				ID: action.ID
			});
		case actions.DEPLOY_LOG_UPDATE:
			return _.assign({}, state, {
				log: action.data.message,
				status: action.data.status
			});
		default:
			return state;
	}
};
