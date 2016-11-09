const React = require('react');
const ReactRedux = require('react-redux');

const actions = require('../../_actions.js');
const constants = require('../../constants/deployment.js');

function canDeploy(deployState) {
	if (constants.hasDeployStarted(deployState)) {
		return false;
	}
	if (constants.isApproved(deployState)) {
		return true;
	}

	return false;
}

function deployButton(props) {

	if (!props.display) {
		return null;
	}
	let btnText = 'Start Deployment';
	if (props.queued) {
		btnText = 'Deployment started';
	}
	return (
		<button
			value="Confirm Deployment"
			className="deploy"
			onClick={props.onClick}
			disabled={props.queued}
		>
			{btnText}
		</button>
	);
}

const mapStateToProps = function(state) {
	const current = state.deployment.list[state.deployment.current_id] || {};
	return {
		queued: constants.isQueued(current.state) || state.deployment.is_queuing,
		display: canDeploy(current.state)
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
