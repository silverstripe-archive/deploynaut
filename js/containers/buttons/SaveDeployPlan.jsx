var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');

const mapStateToProps = function(state) {
	return {
		display: state.deployment.current_id === "",
		disabled: state.plan.is_loading || state.deployment.is_creating,
		style: "btn-wide btn-primary",
		value: "Continue",
		icon: "fa fa-long-arrow-down"
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onClick: function() {
			dispatch(actions.createDeployment());
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Button);
