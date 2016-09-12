var _ = require('underscore');

var actions = require('../_actions.js');

module.exports = function approval(state, action) {
	if (typeof state === 'undefined') {
		return {

			bypassed: false,
			bypassed_time: "",

			rejected: false,
			rejected_time: "",

			request_by: {id: 5, email: "fredrik@example.com", role: "Team Member", name: "Fredrik Fredriksson"},
			request_sent: false,
			request_sent_time: "",

			approved: false,
			approved_time: "",

			approved_by: "",
			approvers: [
				{id: 1, email: "anders@example.com", role: "Release manager", name: "Anders Andersson"},
				{id: 2, email: "bengt@example.com", role: "Release manager", name: "Bengt Bengtsson"},
				{id: 3, email: "daniel@example.com", role: "Release manager", name: "Daniel Danielsson"},
				{id: 4, email: "erik@example.com", role: "Release manager", name: "Erik Eriksson"}
			],
			is_loading: false
		};
	}

	switch (action.type) {
		case actions.SUCCEED_DEPLOYMENT_GET:
			return _.assign({}, state, {
				request_by: action.data.deployment.deployer,
				approved_by: action.data.deployment.approver,
				approved: true,
				bypassed: true,
				rejected: false
			});

		case actions.SET_APPROVER:
			return _.assign({}, state, {
				approved_by: action.id
			});

		case actions.START_APPROVAL_SUBMIT:
			return state;

		case actions.SUCCEED_APPROVAL_SUBMIT:
			return _.assign({}, state, {
				request_sent: true,
				request_sent_time: Date.now()
			});

		case actions.FAIL_APPROVAL_SUBMIT:
			return state;

		case actions.START_APPROVAL_CANCEL:
			return _.assign({}, state, {
				request_sent: false,
				requested_time: '',
				approved: false,
				bypassed: false,
				rejected: false
			});
		case actions.START_APPROVAL_APROVE:
			return _.assign({}, state, {
				approved: true,
				rejected: false
			});
		case actions.START_APPROVAL_REJECT:
			return _.assign({}, state, {
				request_sent: false,
				requested_time: '',
				approved: false,
				bypassed: false,
				rejected: true
			});

		case actions.START_APPROVAL_BYPASS:
			return _.assign({}, state, {
				is_loading: true
			});
		case actions.SUCCEED_APPROVAL_BYPASS:
			return _.assign({}, state, {
				approved: false,
				bypassed: true,
				rejected: false,
				is_loading: false
			});

		default:
			return state;
	}
};
