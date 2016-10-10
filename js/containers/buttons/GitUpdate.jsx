var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');

function isDisabled(state) {
	if (state.git.is_updating || state.plan.is_loading) {
		return true;
	}
	if (state.deployment.submitted) {
		return true;
	}
	if (state.deployment.approved) {
		return true;
	}
	if (state.deployment.queued) {
		return true;
	}
	return false;
}

const mapStateToProps = function(state) {
	let btnValue = state.git.is_updating ? "Fetch code..." : "Fetch code";

	if (state.git.error) {
		btnValue = state.git.error;
	}

	return {
		disabled: isDisabled(state),
		style: "btn-default",
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
