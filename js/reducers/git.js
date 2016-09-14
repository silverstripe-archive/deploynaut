var _ = require('underscore');

var actions = require('../_actions.js');

const initialState = {
	selected_type: "",
	selected_ref: "",
	selected_name: "",
	is_fetching: false,
	is_updating: false,
	last_updated: 0,
	list: {}
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
				const ref = gitRefs.list.find(obj => obj.key === action.id);
				if (ref.value) {
					ref_name = ref.value;
				}
			}
			return _.assign({}, state, {
				selected_ref: action.id,
				selected_name: ref_name
			});
		}
		case actions.START_REPO_UPDATE:
			return _.assign({}, state, {
				is_updating: true
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
			let listAsArray = action.list.refs;

			// The backend returns a proper array if the 'key's are 0, 1, 2, 3
			// but an object if the 'keys' are 1, 2, 3.. this will ensure that
			// we only have to deal with an object.
			if (action.list.refs.constructor === Array) {
				listAsArray = _.assign({}, action.list.refs);
			}
			console.log(listAsArray);
			return _.assign({}, state, {
				is_fetching: false,
				// we do this to force the list into an object, inc ase it's an array
				list: listAsArray,
				last_updated: action.received_at,
				selected_type: "",
				selected_ref: "",
				selected_name: ""
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
