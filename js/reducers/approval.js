const _ = require('underscore');

const actions = require('../_actions.js');

const initialState = {
	error: null,
	is_loading: false,
	submit_is_loading: false,
	cancel_is_loading: false,
	approve_is_loading: false,
	reject_is_loading: false,
};

module.exports = function deployment(state, action) {
	if (typeof state === 'undefined') {
		return initialState;
	}

	switch (action.type) {
		case actions.START_APPROVAL_SUBMIT:
			return _.assign({}, state, {
				submit_is_loading: true,
				is_loading: true
			})
		case actions.START_APPROVAL_CANCEL:
			return _.assign({}, state, {
				cancel_is_loading: true,
				is_loading: true
			})
		case actions.START_APPROVAL_APPROVE:
			return _.assign({}, state, {
				approve_is_loading: true,
				is_loading: true
			})
		case actions.START_APPROVAL_REJECT:
			return _.assign({}, state, {
				reject_is_loading: true,
				is_loading: true
			});
		case actions.FAIL_APPROVAL_SUBMIT:
			return _.assign({}, state, {
				submit_is_loading: false,
				is_loading: false,
				error: action.error.toString()
			})
		case actions.FAIL_APPROVAL_CANCEL:
			return _.assign({}, state, {
				cancel_is_loading: false,
				is_loading: false,
				error: action.error.toString()
			})
		case actions.FAIL_APPROVAL_APPROVE:
			return _.assign({}, state, {
				approve_is_loading: false,
				is_loading: false,
				error: action.error.toString()
			})
		case actions.FAIL_APPROVAL_REJECT:
			return _.assign({}, state, {
				reject_is_loading: false,
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
