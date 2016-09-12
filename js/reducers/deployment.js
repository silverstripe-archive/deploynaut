var _ = require('underscore');

var actions = require('../_actions.js');
var deployStates = require('../constants/deployment.js');

const initialState = {
	is_loading: false,
	enqueued: false,
	id: "",
	data: {},
	log: [],
	error: null,
	state: deployStates.STATE_NEW
};

module.exports = function deployment(state, action) {
	if (typeof state === 'undefined') {
		return initialState;
	}

	switch (action.type) {
		case actions.NEW_DEPLOYMENT:
			return initialState;
		case actions.START_DEPLOYMENT_GET:
			return _.assign({}, state, {
				is_loading: true,
				error: null
			});
		case actions.SUCCEED_DEPLOYMENT_GET:
			return _.assign({}, state, {
				is_loading: false,
				id: action.data.deployment.id,
				state: action.data.deployment.state,
				data: action.data.deployment
			});
		case actions.START_DEPLOYMENT_ENQUEUE:
			return _.assign({}, state, {
				enqueued: true
			});
		case actions.SUCCEED_DEPLOYMENT_ENQUEUE:
			return _.assign({}, state, {
				id: action.id,
				error: null
			});
		case actions.FAIL_DEPLOYMENT_ENQUEUE:
			return _.assign({}, state, {
				error: action.error.toString()
			});

		case actions.SUCCEED_DEPLOY_LOG_UPDATE:
			return _.assign({}, state, {
				log: action.data.message,
				state: action.data.status,
				error: null
			});
		case actions.FAIL_DEPLOY_LOG_UPDATE:
			return _.assign({}, state, {
				error: action.error.toString(),
			});
		default:
			return state;
	}
};
