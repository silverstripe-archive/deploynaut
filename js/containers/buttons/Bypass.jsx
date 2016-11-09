var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');
var constants = require('../../constants/deployment.js');

function canBypass(state) {
	if (!state.user.can_bypass_approval) {
		return false;
	}
	const current = state.deployment.list[state.deployment.current_id] || {};
	if (constants.isApproved(current.state)) {
		return false;
	}
	if (constants.isRejected(current.state)) {
		return false;
	}
	if (constants.isSubmitted(current.state)) {
		return false;
	}
	return true;
}

const mapStateToProps = function(state) {
	return {
		display: canBypass(state),
		disabled: state.deployment.is_loading,
		style: "btn-wide btn-warning",
		value: "Bypass approval",
		icon: "fa fa-level-down"
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onClick: function() {
			dispatch(actions.approveDeployment());
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Button);
