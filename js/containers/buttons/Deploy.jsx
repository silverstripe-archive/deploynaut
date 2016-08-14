var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');

const mapStateToProps = function(state) {
	return {
		display: state.approval.approved && state.git.selected_ref && !state.deployment.enqueued,
		disabled: false,
		style: "btn-success",
		value: "Deploy"
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onClick: function() {
			dispatch(actions.startDeploymentEnqueue());
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Button);
