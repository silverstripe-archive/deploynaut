const _ = require('underscore');

const actions = require('../_actions.js');

module.exports = function environment(state, action) {
	if (typeof state === 'undefined') {
		return {
			id: null,
			name: null,
			project_name: null,
			usage: null,
			supported_options: {},
			approvers: []
		};
	}

	switch (action.type) {
		case actions.SET_ENVIRONMENT:
			return _.assign({}, state, {
				id: action.data.id,
				name: action.data.name,
				project_name: action.data.project_name,
				usage: action.data.usage,
				supported_options: action.data.supported_options,
				approvers: action.data.approvers
			});
		default:
			return state;
	}
};
