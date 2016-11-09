var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');

function isDisabled(state) {
	if (state.git.is_fetching || state.git.is_updating || state.plan.is_loading) {
		return true;
	}
	if (state.deployment.submitted) {
		return true;
	}
	if (state.deployment.approved) {
		return true;
	}
	if (state.deployment.rejected) {
		return true;
	}
	if (state.deployment.queued) {
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
