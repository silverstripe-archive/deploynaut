const _ = require('underscore');

const actions = require('../_actions.js');
const deployStates = require('../constants/deployment.js');

const initialState = {
	is_loading: false,
	id: "",
	data: {},
	// this is a "list" (actually an object) of deployment logs keyed by the deployment id
	logs: {},
	error: null,
	state: deployStates.STATE_NEW,
	submitted: false,
	approved: false,
	rejected: false,
	queued: false,
	approvers: [],
	approver_id: 0,
	// this is the "list" (actually an object) of all deployments that we fetched, updated etc keyed by deployment id
	list: {},
	current_page: 1,
	history_is_loading: false
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
		case actions.START_DEPLOY_HISTORY_GET:
			return _.assign({}, state, {
				history_is_loading: true
			});
		case actions.FAIL_DEPLOY_HISTORY_GET:
			return _.assign({}, state, {
				history_is_loading: false
			});
		case actions.SUCCEED_DEPLOY_HISTORY_GET: {
			// get current list
			const newList = _.assign({}, state.list);
			// add or update the entries in the current list
			for (let i = 0; i < action.data.list.length; i++) {
				newList[action.data.list[i].id] = action.data.list[i];
			}
			return _.assign({}, state, {
				list: newList,
				history_is_loading: false
			});
		}
		case actions.SUCCEED_UPCOMING_DEPLOYMENTS_GET: {
			if (action.data.list.length === 0) {
				return state;
			}
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
				id: "",
				data: {},
				error: null,
				state: deployStates.STATE_NEW,
				submitted: false,
				approved: false,
				rejected: false,
				queued: false,
				approver_id: 0
			});

		case actions.START_DEPLOYMENT_CREATE:
		case actions.START_DEPLOYMENT_GET:
			return _.assign({}, state, {
				is_loading: true,
				error: null
			});

		case actions.SET_APPROVER:
			return _.assign({}, state, {
				approver_id: action.id
			});

		case actions.SUCCEED_APPROVERS_GET:
			return _.assign({}, state, {
				approvers: action.data.approvers
			});

		case actions.START_DEPLOYMENT_QUEUE:
			return _.assign({}, state, {
				queued: true
			});

		case actions.SUCCEED_APPROVAL_SUBMIT:
		case actions.SUCCEED_APPROVAL_CANCEL:
		case actions.SUCCEED_APPROVAL_APPROVE:
		case actions.SUCCEED_APPROVAL_REJECT:
		case actions.SUCCEED_DEPLOYMENT_QUEUE:
		case actions.SUCCEED_DEPLOYMENT_CREATE:
		case actions.SUCCEED_DEPLOYMENT_GET: {
			// get current list
			const newList = _.assign({}, state.list);
			newList[action.data.deployment.id] = action.data.deployment;

			return _.assign({}, state, {
				is_loading: false,
				error: null,
				id: action.data.deployment.id,
				state: action.data.deployment.state,
				submitted: deployStates.isSubmitted(action.data.deployment.state),
				approved: deployStates.isApproved(action.data.deployment.state),
				rejected: deployStates.isRejected(action.data.deployment.state),
				approver_id: action.data.deployment.approver ? action.data.deployment.approver.id : 0,
				data: action.data.deployment,
				list: newList
			});
		}

		case actions.FAIL_APPROVAL_SUBMIT:
		case actions.FAIL_APPROVAL_CANCEL:
		case actions.FAIL_APPROVAL_APPROVE:
		case actions.FAIL_APPROVAL_REJECT:
		case actions.FAIL_APPROVERS_GET:
		case actions.FAIL_DEPLOYMENT_QUEUE:
		case actions.FAIL_DEPLOY_LOG_UPDATE:
		case actions.FAIL_DEPLOYMENT_CREATE:
		case actions.FAIL_DEPLOYMENT_GET:
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

		default:
			return state;
	}
};
