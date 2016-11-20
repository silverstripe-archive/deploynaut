const ReactRedux = require('react-redux');

const actions = require('../../_actions.js');
const Button = require('../../components/Button.jsx');
const constants = require('../../constants/deployment.js');

function canReject(state) {
	if (!state.user.can_approve) {
		return false;
	}
	const current = state.deployment.list[state.deployment.current_id] || {};
	if (constants.isApproved(current.state)) {
		return false;
	}
	if (constants.isRejected(current.state)) {
		return false;
	}
	return true;
}

const mapStateToProps = function(state) {
	return {
		display: canReject(state),
		disabled: state.approval.is_loading,
		style: "btn-wide btn-danger",
		value: "Reject"
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onClick: function() {
			dispatch(actions.rejectDeployment());
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Button);
