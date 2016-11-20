var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');
const constants = require('../../constants/deployment.js');

const mapStateToProps = function(state) {
	const current = state.deployment.list[state.deployment.current_id] || {};
	return {
		display: state.user.can_approve && constants.isSubmitted(current.state),
		disabled: state.approval.is_loading,
		style: "btn-success btn-wide",
		value: "Approve"
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
