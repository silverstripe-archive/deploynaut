var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');
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
