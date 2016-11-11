var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');

function isDisplayed(state) {
	if (state.plan.is_loading || state.deployment.is_creating) {
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
	return {
		display: isDisplayed(state),
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
