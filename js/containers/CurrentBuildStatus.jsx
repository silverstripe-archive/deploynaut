var React = require('react');
var ReactRedux = require('react-redux');
var actions = require('../_actions.js');

var CurrentBuildStatus = function(props) {
	var shortSha = "";
	if (typeof props.deployment.sha === 'string') {
		shortSha = props.deployment.sha.substring(0, 7);
	}

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
					<span className="sha-detail" title={props.deployment.sha}>{shortSha}</span>
				</a>
				<span className="deployed-detail">Deployed {props.deployment.created}</span>
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
	return {
		deployment: state.currentbuild.data,
		error: state.currentbuild.error
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onItemClick: function(id) {
			dispatch(actions.getDeployment(id))
				.then(() => dispatch(actions.openPlanDialog()));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(CurrentBuildStatus);
