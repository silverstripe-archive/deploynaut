var ReactRedux = require('react-redux');

var _ = require('underscore');
var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');

function canBypass(state) {
	if (_.isEmpty(state.plan.changes)) {
		return false;
	}
	if (!state.user.can_bypass_approval) {
		return false;
	}
	if (state.deployment.approved) {
		return false;
	}
	if (state.deployment.rejected) {
		return false;
	}
	if (state.deployment.submitted) {
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
