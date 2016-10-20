const React = require('react');
const ReactRedux = require('react-redux');

const StatusBox = require('../components/StatusBox.jsx');
const DeployDiff = require('../components/DeployDiff.jsx');

/**
 * This simple container is a locked down / readonly version of the first step
 * (git ref selector) that are shown when a deployment is waiting for approval
 * or deploy
 */
const TargetReleaseRO = React.createClass({

	getInitialState: function() {
		return {
			open: false
		};
	},

	toggleOpen: function() {
		this.setState({
			open: !this.state.open
		});
	},

	render: function() {
		const props = this.props;

		if (props.length < 1) {
			return (
				<div className="section">
					<header id="0">Target release</header>
				</div>
			);
		}

		let deployDiff = null;
		let linkName = "View details";
		let caret = 'down';
		if (this.state.open) {
			deployDiff = <DeployDiff changes={props.deployment.changes} />;
			linkName = "Hide details";
			caret = 'up';
		}

		return (
			<div className="section target-release">
				<header id="0">Target release</header>
				<div>{props.ref_type_description}</div>

				<StatusBox type="default">
					<span className="label label-default">{props.deployment.branch}</span>&nbsp;
					<a
						className="sha-detail"
						href={props.deployment.commit_url}
						title={props.deployment.sha}
					>
						{props.deployment.short_sha}
					</a>&nbsp;
					<span className="deployed-detail">{props.deployment.commit_message}</span>
					<div style={{float: "right"}}>
						<span>
							<a href={"javascript:void(0);"} onClick={this.toggleOpen}>{linkName}</a>&nbsp;
							<i className={"fa fa-caret-" + caret}></i>
						</span>
					</div><br />

					{deployDiff}
				</StatusBox>

				<div className="row">
					<div className="col-md-6">
						<dl className="dl-horizontal">
							<dt>Environment</dt>
							<dd>{props.environment}</dd>
							<dt>Deployment type</dt>
							<dd>{props.deployment.deployment_type}</dd>
							<dt>Deployment time</dt>
							<dd>{props.deployment.deployment_estimate} min</dd>
							<dt>Version</dt>
							<dd>{props.deployment.short_sha}</dd>
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
	}
});

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

const mapDispatchToProps = function() {
	return {};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(TargetReleaseRO);
