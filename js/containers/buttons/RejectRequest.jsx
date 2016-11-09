var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');
const constants = require('../../constants/deployment.js');

const mapStateToProps = function(state) {
	const current = state.deployment.list[state.deployment.current_id] || {};
	return {
		display: constants.isSubmitted(current.state),
		disabled: state.deployment.is_loading,
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
