var _ = require('underscore');

var actions = require('./_actions.js');

// root reducer
module.exports = function(state, action) {
	if(typeof state === 'undefined') {
		console.warn("state is undefined"); // eslint-disable-line no-console
		return {};
	}

	switch(action.type) {

		case actions.SET_MESSAGE:
			return _.assign({}, state, {
				message: action.message,
				message_type: action.message_type
			});

		case actions.SET_API_ENDPOINT:
			return _.assign({}, state, {
				api_endpoint: action.url
			});

		case actions.SET_ACTIVE_STEP:
			return _.assign({}, state, {
				activeStep: action.id
			});

		case actions.SET_GIT_REF_TYPE:
			return _.assign({}, state, {
				git: _.assign({}, state.git, {
					selected_type: action.id,
					selected_ref: ""
				})
			});
		case actions.SET_GIT_REF:
			return _.assign({}, state, {
				git: _.assign({}, state.git, {
					selected_ref: action.id
				})
			});
		case actions.START_GIT_UPDATE:
			return _.assign({}, state, {
				git: _.assign({}, state.git, {
					is_fetching: true
				})
			});
		case actions.SUCCEED_GIT_UPDATE:
			return _.assign({}, state, {
				git: _.assign({}, state.git, {
					is_fetching: false,
					list: action.list,
					last_updated: action.receivedAt,
					selected_type: "",
					selected_ref: ""
				})
			});

		case actions.SET_SUMMARY:
			return _.assign({}, state, {
				summary_of_changes: action.text
			});

		case actions.SET_APPROVER:
			return _.assign({}, state, {
				approval: _.assign({}, state.approval, {
					approved_by: action.id
				})
			});

		case actions.START_APPROVAL_SUBMIT:
			return state;

		case actions.SUCCEED_APPROVAL_SUBMIT:
			return _.assign({}, state, {
				approval: _.assign({}, state.approval, {
					request_sent: true,
					request_sent_time: Date.now()
				})
			});

		case actions.FAIL_APPROVAL_SUBMIT:
			return state;

		case actions.START_APPROVAL_CANCEL:
			return _.assign({}, state, {
				approval: _.assign({}, state.approval, {
					request_sent: false,
					requested_time: '',
					approved: false,
					bypassed: false,
					rejected: false
				})
			});
		case actions.START_APPROVAL_APROVE:
			return _.assign({}, state, {
				approval: _.assign({}, state.approval, {
					approved: true,
					rejected: false
				})
			});
		case actions.START_APPROVAL_REJECT:
			return _.assign({}, state, {
				approval: _.assign({}, state.approval, {
					request_sent: false,
					requested_time: '',
					approved: false,
					bypassed: false,
					rejected: true
				})
			});

		case actions.START_DEPLOYMENT_ENQUEUE:
			return _.assign({}, state, {
				deployment: _.assign({}, state.approval, {
					enqueued: true
				})
			});

		default:
			return state;
	}
};
