const React = require('react');
const ReactRedux = require('react-redux');

const actions = require('../../_actions.js');
const constants = require('../../constants/deployment.js');

function canDeploy(state) {
	if (constants.hasDeployStarted(state.deployment.state)) {
		return false;
	}
	if (state.deployment.queued) {
		return false;
	}
	if (state.deployment.approved) {
		return true;
	}
	return false;
}

function deployButton(props) {

	if (!props.display) {
		return null;
	}
	return (
		<button
			value="Confirm Deployment"
			className="deploy"
			onClick={props.onClick}
		>
			Start Deployment
		</button>
	);
}

const mapStateToProps = function(state) {
	return {
		display: canDeploy(state)
	};
};

const mapDispatchToProps = function(dispatch, ownProps) {
	return {
		onClick: function() {
			dispatch(actions.startDeploy(ownProps.sha));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(deployButton);
