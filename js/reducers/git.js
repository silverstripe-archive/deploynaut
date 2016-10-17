const _ = require('underscore');

const actions = require('../_actions.js');

const initialState = {
	selected_type: "",
	selected_ref: "",
	selected_name: "",
	is_fetching: false,
	is_updating: false,
	last_fetched_date: "",
	last_fetched_ago: "",
	last_updated: 0,
	list: {},
	options: [],
	selected_options: []
};

module.exports = function git(state, action) {
	if (typeof state === 'undefined') {
		return initialState;
	}
	switch (action.type) {
		case actions.NEW_DEPLOYMENT:
			return _.assign({}, state, {
				selected_type: "",
				selected_ref: "",
				selected_name: "",
			});
		case actions.SET_REVISION_TYPE:
			return _.assign({}, state, {
				selected_type: action.id,
				selected_ref: "",
				selected_name: ""
			});
		case actions.TOGGLE_OPTION:
			let selected_options = state.selected_options;
			if (selected_options[action.id] === 1) {
				selected_options[action.id] = 0;
			} else {
				selected_options[action.id] = 1;
			}
			return _.assign({}, state, {
				selected_options: selected_options
			});
		case actions.SUCCEED_DEPLOYMENT_GET:
			return _.assign({}, state, {
				selected_ref: action.data.deployment.sha,
				selected_type: action.data.deployment.ref_type,
			});
		case actions.SET_REVISION: {
			// get the 'nice' name of the commit, i.e the branch or tag name
			const gitRefs = state.list[state.selected_type] || [];
			let ref_name = action.id;
			if (gitRefs.list) {
				const ref = gitRefs.list.find(obj => obj.id === action.id);
				if (ref.title) {
					ref_name = ref.title;
				}
			}
			return _.assign({}, state, {
				selected_ref: action.id,
				selected_name: ref_name
			});
		}
		case actions.START_REPO_UPDATE:
			return _.assign({}, state, {
				is_updating: true,
				selected_type: "",
				selected_ref: "",
				selected_name: ""
			});

		case actions.SUCCEED_REPO_UPDATE:
			return _.assign({}, state, {
				is_updating: false,
				last_updated: action.received_at
			});

		case actions.FAIL_REPO_UPDATE:
			return _.assign({}, state, {
				is_updating: false,
				error: action.error.toString()
			});

		case actions.START_REVISIONS_GET:
			return _.assign({}, state, {
				is_fetching: true
			});

		case actions.SUCCEED_REVISIONS_GET: {
			let listAsArray = action.data.refs;

			// The backend returns a proper array if the 'key's are 0, 1, 2, 3
			// but an object if the 'keys' are 1, 2, 3.. this will ensure that
			// we only have to deal with an object.
			if (action.data.refs.constructor === Array) {
				listAsArray = _.assign({}, action.data.refs);
			}

			let selected_options = [];
			for (var i = 0; i < action.data.options.length; i++) {
				if (action.data.options[i].defaultValue === true) {
					selected_options[i] = 1;
				}
			}

			return _.assign({}, state, {
				is_fetching: false,
				// we do this to force the list into an object, in case it's an array
				list: listAsArray,
				options: action.data.options,
				selected_options: selected_options,
				last_fetched_date: action.data.last_fetched_date,
				last_fetched_ago: action.data.last_fetched_ago,
				last_updated: action.received_at
			});
		}
		case actions.FAIL_REVISIONS_GET:
			return _.assign({}, state, {
				is_fetching: false
			});

		default:
			return state;
	}
};
