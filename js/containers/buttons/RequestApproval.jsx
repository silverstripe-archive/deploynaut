const ReactRedux = require('react-redux');

const actions = require('../../_actions.js');
const Button = require('../../components/Button.jsx');
const constants = require('../../constants/deployment.js');

function canRequest(state) {
	const current = state.deployment.list[state.deployment.current_id] || {};
	if (!current.approver_id) {
		return false;
	}
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
	const btnValue = state.approval.submit_is_loading ? 'Sending request' : 'Send request';
	const icon = state.approval.submit_is_loading ? 'fa fa-refresh fa-spin' : 'fa fa-envelope';
	return {
		display: canRequest(state),
		disabled: state.approval.is_loading,
		style: "btn-wide btn-success",
		value: btnValue,
		icon: icon
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onClick: function() {
			dispatch(actions.submitForApproval());
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Button);
