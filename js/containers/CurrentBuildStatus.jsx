const React = require('react');
const ReactRedux = require('react-redux');
const BuildStatus = require('../components/BuildStatus.jsx');

const _ = require('underscore');
const actions = require('../_actions.js');

const CurrentBuildStatus = function(props) {
	if (props.error) {
		return (
			<div className="current-build-status alert alert-danger">
				<div className="">
					{props.error}
				</div>
			</div>
		);
	}

	if (typeof props.deployment.short_sha === 'undefined') {
		return null;
	}

	return (
		<div className="current-build-status" >
			<BuildStatus deployment={props.deployment} openDeployHandler={props.onItemClick} />
		</div>
	);
};

const mapStateToProps = function(state) {

	// try to find the current build in the list of all deployments
	let currentBuild = {};
	if (typeof state.deployment.list === "object") {
		// return the first match in the list
		currentBuild = _.find(state.deployment.list, function(deploy) {
			return deploy.is_current_build === true;
		});
	}
	if (!currentBuild) {
		currentBuild = {};
	}

	return {
		deployment: currentBuild,
		error: null
	};
};

const mapDispatchToProps = function() {
	return {
		onItemClick: function(id) {
			actions.history.push('/deployment/' + id.toString());
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(CurrentBuildStatus);
