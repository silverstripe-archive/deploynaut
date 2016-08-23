var actions = require('../_actions.js');

module.exports = function messages(state, action) {
	if(typeof state === 'undefined') {
		return [];
	}

	switch(action.type) {
		case actions.SUCCEED_SUMMARY_GET:
			return action.summary.messages;

		// clear the messages on these actions
		case actions.SUCCEED_REPO_UPDATE:
		case actions.SUCCEED_REVISIONS_GET:
		case actions.SET_REVISION:
			return [];
		default:
			return state;
	}
};
