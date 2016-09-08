var _ = require('underscore');

var actions = require('../_actions.js');

module.exports = function deployment(state, action) {
	if(typeof state === 'undefined') {
		return {
			is_loading: false,
			enqueued: false,
			id: "",
			deployment: null,
			log: [],
			status: ""
		};
	}

	switch(action.type) {
		case actions.START_DEPLOYMENT_GET:
			return _.assign({}, state, {
				is_loading: true
			});
		case actions.SUCCEED_DEPLOYMENT_GET:
			return _.assign({}, state, {
				is_loading: false,
				deployment: action.data.deployment
			});
		case actions.START_DEPLOYMENT_ENQUEUE:
			return _.assign({}, state, {
				enqueued: true
			});
		case actions.SUCCEED_DEPLOYMENT_ENQUEUE:
			return _.assign({}, state, {
				ID: action.id
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
