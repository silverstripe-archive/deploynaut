const React = require('react');
const ReactRedux = require('react-redux');

const _ = require('underscore');
const actions = require('../_actions.js');

const CurrentBuildStatus = function(props) {
	if (props.error) {
		return (
			<div className="current-build alert alert-danger">
				<div className="">
					{props.error}
				</div>
			</div>
		);
	}

	return (
		<div className="current-build build-status">
			<div className="build-details">
				<a className="branch-detail" href={props.deployment.commit_url}>{props.deployment.branch}
					<span className="sha-detail" title={props.deployment.sha}>{props.deployment.short_sha}</span>
				</a>
				<span className="deployed-detail">Deployed {props.deployment.date_started}</span>
			</div>
			<ul className="build-actions">
				<li>
					<a className="repo-action" href={props.deployment.commit_url}>
						<i className="fa fa-github-alt"></i>
					</a>
				</li>
				<li>
					<a className="info-action" onClick={() => props.onItemClick(props.deployment.id)}>
						<i className="fa fa-info-circle"></i>
					</a>
				</li>
			</ul>
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
