const _ = require('underscore');

const actions = require('../_actions.js');

const initialState = {
	error: null,
	is_loading: false,
};

module.exports = function deployment(state, action) {
	if (typeof state === 'undefined') {
		return initialState;
	}

	switch (action.type) {
		case actions.START_APPROVAL_SUBMIT:
		case actions.START_APPROVAL_CANCEL:
		case actions.START_APPROVAL_APPROVE:
		case actions.START_APPROVAL_REJECT:
			return _.assign({}, state, {
				is_loading: true
			});
		case actions.FAIL_APPROVAL_SUBMIT:
		case actions.FAIL_APPROVAL_CANCEL:
		case actions.FAIL_APPROVAL_APPROVE:
		case actions.FAIL_APPROVAL_REJECT:
			return _.assign({}, state, {
				is_loading: false,
				error: action.error.toString()
			});
		case actions.SUCCEED_APPROVAL_SUBMIT:
		case actions.SUCCEED_APPROVAL_CANCEL:
		case actions.SUCCEED_APPROVAL_APPROVE:
		case actions.SUCCEED_APPROVAL_REJECT:
			return initialState;
		default:
			return state;
	}
};
