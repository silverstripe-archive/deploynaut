var ReactRedux = require('react-redux');

var _ = require('underscore');
var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');

function canRequest(state) {
	if (_.isEmpty(state.plan.changes)) {
		return false;
	}
	if (!state.deployment.approver_id) {
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
		display: canRequest(state),
		disabled: state.deployment.is_loading,
		style: "btn-wide btn-success",
		value: 'Send request',
		icon: 'fa fa-envelope'
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onClick: function() {
			dispatch(actions.createDeployment())
				.then(() => dispatch(actions.submitForApproval()));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Button);
