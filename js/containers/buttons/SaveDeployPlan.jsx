var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');

function isDisplayed(state) {
	if (state.plan.is_loading) {
		return false;
	}
	if (state.plan.validation_code === 'error') {
		return false;
	}
	if (state.deployment.current_id !== "") {
		return false;
	}
	return true;
}

const mapStateToProps = function(state) {
	const text = state.deployment.is_creating ? 'Calculating impulses' : 'Continue';
	const icon = (state.deployment.is_creating) ? 'fa fa-refresh fa-spin' : 'fa fa-long-arrow-down';
	return {
		display: isDisplayed(state),
		disabled: state.deployment.is_creating,
		style: "btn-wide btn-primary",
		value: text,
		icon: icon
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
