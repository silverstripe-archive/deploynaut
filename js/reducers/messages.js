var git = require('../actions/git.js');
var plan = require('../actions/plan.js');

module.exports = function messages(state, action) {
	if(typeof state === 'undefined') {
		return [];
	}

	switch(action.type) {
		case plan.SUCCEED_SUMMARY_GET:
			return action.summary.messages;

		// clear the messages on these actions
		case git.SUCCEED_REPO_UPDATE:
		case git.SUCCEED_REVISIONS_GET:
		case git.SET_REVISION:
			return [];
		default:
			return state;
	}
};
