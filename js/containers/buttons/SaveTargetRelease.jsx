var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');
var message = require('../../constants/messages.js');

// keep it the same between render calls by deciding the random message on import
const loadingMessage = message.getRandom();

const mapStateToProps = function(state) {
	const text = state.plan.is_loading ? loadingMessage : 'Continue';
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
