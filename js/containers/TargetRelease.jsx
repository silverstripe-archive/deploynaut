var React = require('react');
var ReactRedux = require('react-redux');

/**
 * This simple container is a locked down / readonly version of the first step
 * (git ref selector) that are shown when a deployment is waiting for approval
 * or deploy
 */
var targetRelease = function(props) {

	if (props.length < 1) {
		return (
			<div className="section">
				<header id="0">Target release</header>
			</div>
		);
	}

	return (
		<div className="section">
			<header id="0">Target release</header>
			<div>{props.ref_type_description}</div>
			<div className="build-status build-details">
				<a className="sha-detail"
					href={props.deployment.commit_url}
					title={props.deployment.sha}>{props.deployment.short_sha}</a>
				<span className="deployment-branch">{props.deployment.branch}</span>
				<span className="deployed-detail">{props.deployment.commit_message}</span>
			</div>

			<div className="row">
				<div className="col-md-6">
					<dl className="dl-horizontal">
						<dt>Environment</dt>
						<dd>{props.environment}</dd>
						<dt>Deployment type</dt>
						<dd>{props.deployment.deployment_type}</dd>
						<dt>Deployment time</dt>
						<dd>{props.deployment.deployment_estimate} min</dd>
					</dl>
				</div>
				<div className="col-md-6">
					<dl className="dl-horizontal">
						<dt>Requested by</dt>
						<dd>{props.deployment.deployer.name}</dd>
						<dt>Date Requested</dt>
						<dd>{props.deployment.date_requested_nice}</dd>
					</dl>
				</div>
			</div>
		</div>
	);
};

const mapStateToProps = function(state) {
	if (typeof state.deployment.list[state.deployment.id] === 'undefined') {
		return {};
	}

	const deploy = state.deployment.list[state.deployment.id];

	let ref_type_description = "";
	if (state.git.list[deploy.ref_type]) {
		ref_type_description = state.git.list[deploy.ref_type].description;
	}

	return {
		deployment: deploy,
		environment: state.environment.name,
		ref_type_description: ref_type_description
	};
};

const mapDispatchToProps = function(dispatch) {
	return {};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(targetRelease);
