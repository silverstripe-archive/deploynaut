var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');

const mapStateToProps = function(state) {
	const text = state.plan.is_loading ? 'Stacking the punchcards' : 'Continue';
	const icon = state.plan.is_loading ? 'fa fa-refresh fa-spin' : 'fa fa-long-arrow-down';
	return {
		display: !state.plan.changes && state.git.selected_ref,
		style: "btn-wide btn-primary",
		value: text,
		icon: icon,
		disabled: state.plan.is_loading
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
