var _ = require('underscore');

var actions = require('./_actions.js');

// root reducer
module.exports = function(state, action) {
	if(typeof state === 'undefined') {
		console.warn("state is undefined"); // eslint-disable-line no-console
		return {};
	}

	switch(action.type) {

		case actions.SET_ACTIVE_STEP:
			return _.assign({}, state, {
				activeStep: action.id
			});

		case actions.SET_REVISION_TYPE:
			return _.assign({}, state, {
				git: _.assign({}, state.git, {
					selected_type: action.id,
					selected_ref: ""
				})
			});
		case actions.SET_REVISION:
			return _.assign({}, state, {
				git: _.assign({}, state.git, {
					selected_ref: action.id
				})
			});
		case actions.START_REPO_UPDATE:
			return _.assign({}, state, {
				git: _.assign({}, state.git, {
					is_updating: true
				})
			});

		case actions.SUCCEED_REPO_UPDATE:
			return _.assign({}, state, {
				git: _.assign({}, state.git, {
					is_updating: false,
					last_updated: action.receivedAt
				})
			});

		case actions.FAIL_REPO_UPDATE:
			return _.assign({}, state, {
				git: _.assign({}, state.git, {
					is_updating: false
				})
			});

		case actions.START_REVISIONS_GET:
			return _.assign({}, state, {
				message: "",
				message_type: "",
				git: _.assign({}, state.git, {
					is_fetching: true
				})
			});

		case actions.SUCCEED_REVISIONS_GET:
			return _.assign({}, state, {
				git: _.assign({}, state.git, {
					is_fetching: false,
					list: action.list,
					last_updated: action.receivedAt,
					selected_type: "",
					selected_ref: ""
				}),
				plan: _.assign({}, state.plan, {
					deployment_type: "",
					deployment_estimate: "",
					is_loading: false,
					changes: {}
				})
			});

		case actions.FAIL_REVISIONS_GET:
			return _.assign({}, state, {
				git: _.assign({}, state.git, {
					is_fetching: false
				})
			});

		case actions.START_SUMMARY_GET:
			return _.assign({}, state, {
				plan: _.assign({}, state.plan, {
					deployment_type: "",
					deployment_estimate: "",
					is_loading: true,
					validation_code: "",
					changes: {}
				})
			});

		case actions.SUCCEED_SUMMARY_GET:
			var changes = {};
			// backend can sometimes return an empty array instead of an object
			if(action.summary.changes.length !== 0) {
				changes = action.summary.changes;
			}
			return _.assign({}, state, {
				messages: action.summary.messages,
				plan: _.assign({}, state.plan, {
					deployment_type: action.summary.actionCode || "",
					deployment_estimate: action.summary.estimatedTime || "",
					is_loading: false,
					changes: changes,
					validation_code: action.summary.validationCode
				})
			});

		case actions.FAIL_SUMMARY_GET:
			return _.assign({}, state, {
				message: action.error.toString || action.error,
				message_type: "danger",
				plan: _.assign({}, state.plan, {
					is_loading: false
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
