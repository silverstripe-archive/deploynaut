const _ = require('underscore');

const actions = require('../_actions.js');

module.exports = function user(state, action) {
	if (typeof state === 'undefined') {
		return {
			can_approve: false,
			can_bypass_approval: false,
			can_abort_deployment: false
		};
	}

	switch (action.type) {
		case actions.SET_USER:
			return _.assign({}, state, {
				can_approve: action.data.can_approve,
				can_bypass_approval: action.data.can_bypass_approval,
				can_abort_deployment: action.data.can_abort_deployment
			});
		default:
			return state;
	}
};
