const React = require('react');
const ReactRedux = require('react-redux');

const actions = require('../_actions.js');
const constants = require('../constants/deployment.js');
const AbortButton = require('../containers/buttons/AbortDeployment.jsx');

function getHeaderText(deployState) {
	switch (deployState) {
		case constants.STATE_COMPLETED:
			return 'Successfully deployed';
		case constants.STATE_FAILED:
			return 'Failed deployment';
		case constants.STATE_ABORTING:
			return 'Aborting deployment';
		default:
			return 'Deploying';
	}
}

function getDescriptionText(deployState) {
	switch (deployState) {
		case constants.STATE_DEPLOYING:
		case constants.STATE_QUEUED:
			return 'and come back at any time to check its progress.';
		default:
			return 'and come back to access this information at any time.';
	}
}

function getHeaderIcon(deployState) {
	switch (deployState) {
		case constants.STATE_DEPLOYING:
		case constants.STATE_QUEUED:
		case constants.STATE_APPROVED:
			return 'fa-cogs';
		case constants.STATE_FAILED:
			return 'fa-exclamation-triangle';
		default:
			return 'fa-rocket';
	}
}

function getTimeInformation(deployState, props) {
	switch (deployState) {
		case constants.STATE_DEPLOYING:
		case constants.STATE_QUEUED:
			return "Approximately " + props.deployment_estimate + " minutes";
		default:
			return props.date_started_nice;
	}
}

function DeploymentStatusBar(props) {
	const deployState = props.state;

	const headerText = getHeaderText(deployState);
	const descriptionText = getDescriptionText(deployState);
	const headerIcon = getHeaderIcon(deployState);
	const timeInformation = getTimeInformation(deployState, props);

	return (
		<div className="deployment-status-bar fade-in">
			<div className={"deployment-status-icon " + deployState}>
				<i className={"fa " + headerIcon} aria-hidden="true" />
			</div>
			<div className="deployment-status-text-parent">
				<div className="deployment-status-text-child">
					<div className="deployment-status-header">
						{headerText} to
						<strong> {props.project_name} / {props.environment_name}</strong> <small>{timeInformation}</small>
					</div>
					<div className="deployment-status-close-notice">
						You may <a
							href={"javascript:void(0);"}
							onClick={props.onClose}
						>close this screen</a> {descriptionText}
					</div>
				</div>
				<div className="pull-right">
					<AbortButton />
				</div>
			</div>
		</div>
	);
}

const mapStateToProps = function(state) {
	const current = state.deployment.list[state.deployment.current_id] || {};
	return {
		state: current.state,
		environment_name: state.environment.name,
		project_name: state.environment.project_name,
		deployment_estimate: current.deployment_estimate,
		date_started_nice: current.date_started_nice,
	};
};

const mapDispatchToProps = function() {
	return {
		onClose: function() {
			actions.history.push('/');
		},
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(DeploymentStatusBar);
