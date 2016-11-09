var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');
const constants = require('../../constants/deployment.js');

function isDisabled(state) {
	if (state.git.is_fetching || state.git.is_updating || state.plan.is_loading) {
		return true;
	}
	const current = state.deployment.list[state.deployment.current_id] || {};
	if (constants.isSubmitted(current.state)) {
		return true;
	}
	if (constants.isApproved(current.state)) {
		return true;
	}
	if (constants.isRejected(current.state)) {
		return true;
	}
	if (constants.isQueued(current.state)) {
		return true;
	}
	return false;
}

const mapStateToProps = function(state) {
	let btnValue = (state.git.is_fetching || state.git.is_updating) ? 'Fetching code...' : 'Fetch code';

	if (state.git.error) {
		btnValue = state.git.error;
	}

	return {
		disabled: isDisabled(state),
		icon: 'fa fa-refresh',
		style: 'btn-wide btn-default',
		value: btnValue
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onClick: function() {
			dispatch(actions.updateRepoAndGetRevisions());
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Button);
