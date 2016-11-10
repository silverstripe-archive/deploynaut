var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');

const mapStateToProps = function(state) {
	return {
		display: !state.plan.changes && !state.plan.is_loading && state.git.selected_ref,
		style: "btn-wide btn-primary",
		value: "Continue",
		icon: "fa fa-long-arrow-down"
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onClick: function() {
			dispatch(actions.getDeploySummary());
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Button);
