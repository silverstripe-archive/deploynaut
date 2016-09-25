const _ = require('underscore');

const actions = require('../_actions.js');
const deployStates = require('../constants/deployment.js');

const initialState = {
	is_loading: false,
	enqueued: false,
	id: "",
	data: {},
	// this is a "list" (actually an object) of deployment logs keyed by the deployment id
	logs: {},
	error: null,
	selected: {},
	state: deployStates.STATE_NEW,
	// this is the "list" (actually an object) of all deployments that we fetched, updated etc keyed by the deployment
	// id
	list: {},
	current_page: 1
};

module.exports = function deployment(state, action) {
	if (typeof state === 'undefined') {
		return initialState;
	}

	switch (action.type) {
		case actions.SET_DEPLOY_HISTORY_PAGE: {
			return _.assign({}, state, {
				current_page: action.page
			});
		}
		case actions.SUCCEED_DEPLOY_HISTORY_GET:
		case actions.SUCCEED_UPCOMING_DEPLOYMENTS_GET: {
			// get current list
			const newList = _.assign({}, state.list);
			// add or update the entries in the current list
			for (let i = 0; i < action.data.list.length; i++) {
				newList[action.data.list[i].id] = action.data.list[i];
			}
			return _.assign({}, state, {
				list: newList,
			});
		}
		case actions.NEW_DEPLOYMENT:
			return _.assign({}, state, {
				is_loading: false,
				enqueued: false,
				id: "",
				data: {},
				error: null,
				state: deployStates.STATE_NEW,
			});

		case actions.START_DEPLOYMENT_GET:
			return _.assign({}, state, {
				is_loading: true,
				error: null
			});

		case actions.SUCCEED_APPROVAL_BYPASS:
		case actions.SUCCEED_CURRENT_BUILD_STATUS_GET:
		case actions.SUCCEED_DEPLOYMENT_GET: {
			// get current list
			const newList = _.assign({}, state.list);
			newList[action.data.deployment.id] = action.data.deployment;

			return _.assign({}, state, {
				is_loading: false,
				id: action.data.deployment.id,
				state: action.data.deployment.state,
				data: action.data.deployment,
				list: newList
			});
		}
		case actions.START_DEPLOYMENT_ENQUEUE:
			return _.assign({}, state, {
				enqueued: true
			});
		case actions.SUCCEED_DEPLOYMENT_ENQUEUE: {
			const newList = _.assign({}, state.list);
			newList[action.data.deployment.id] = action.data.deployment;

			return _.assign({}, state, {
				id: action.data.deployment.id,
				list: newList,
				error: null
			});
		}
		case actions.FAIL_DEPLOYMENT_ENQUEUE:
			return _.assign({}, state, {
				error: action.error.toString()
			});

		case actions.SUCCEED_DEPLOY_LOG_UPDATE: {
			const newList = _.assign({}, state.list);
			newList[action.data.deployment.id] = action.data.deployment;

			const newLogList = _.assign({}, state.logs);
			newLogList[action.data.deployment.id] = action.data.message;

			return _.assign({}, state, {
				logs: newLogList,
				state: action.data.status,
				error: null,
				list: newList
			});
		}
		case actions.FAIL_DEPLOY_LOG_UPDATE:
			return _.assign({}, state, {
				error: action.error.toString(),
			});
		default:
			return state;
	}
};
