var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');
const constants = require('../../constants/deployment.js');

function canDeploy(state) {
	let currentState = 'new';
	if (typeof state.deployment.list[state.deployment.id] !== 'undefined') {
		currentState = state.deployment.list[state.deployment.id].state;
	}
	if (constants.hasDeployStarted(currentState)) {
		return false;
	}
	if (state.approval.enqueued) {
		return false;
	}
	if (state.approval.bypassed) {
		return true;
	}
	if (state.approval.approved) {
		return true;
	}
	return false;
}

const mapStateToProps = function(state) {
	return {
		display: canDeploy(state),
		style: "btn-success",
		value: "Deploy"
	};
};

const mapDispatchToProps = function(dispatch, ownProps) {
	return {
		onClick: function() {
			dispatch(actions.startDeploy(ownProps.sha));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Button);
