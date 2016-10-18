const _ = require('underscore');

const actions = require('../_actions.js');

module.exports = function environment(state, action) {
	if (typeof state === 'undefined') {
		return {
			id: null,
			name: null,
			usage: null,
			supported_options: {}
		};
	}

	switch (action.type) {
		case actions.SET_ENVIRONMENT:
			return _.assign({}, state, {
				id: action.data.id,
				name: action.data.name,
				usage: action.data.usage,
				supported_options: action.data.supported_options
			});
		default:
			return state;
	}
};
