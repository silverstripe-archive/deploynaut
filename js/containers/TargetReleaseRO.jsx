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
		let linkName = 'View details';
		let caret = 'up';
		if (this.state.open) {
			deployDiff = <DeployDiff changes={props.deployment.changes} />;
			linkName = 'Hide details';
			caret = 'down';
		}

		let deployer = null;
		if (props.deployment.deployer) {
			deployer = props.deployment.deployer.name;
		}

		return (
			<div className="section target-release">
				<header id="0">Target release</header>
				<div>{props.ref_type_description}</div>

				<StatusBox type="default">
					<span className="label label-default">{props.deployment.ref_name}</span>&nbsp;
					<a
						className="sha-detail"
						href={props.deployment.commit_url}
						title={props.deployment.sha}
					>
						{props.deployment.short_sha}
					</a>&nbsp;
					<span className="deployed-detail">{props.deployment.commit_subject}</span>
					<div style={{float: "right"}}>
						<span>
							<a href={"javascript:void(0);"} onClick={this.toggleOpen}>{linkName} <i className={"fa fa-caret-" + caret}></i></a>&nbsp;
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
							<dd>{deployer}</dd>
							<dt>Date requested</dt>
							<dd>{props.date_requested}</dd>
						</dl>
					</div>
				</div>
			</div>
		);
	}
});

const mapStateToProps = function(state) {
	if (typeof state.deployment.list[state.deployment.current_id] === 'undefined') {
		return {};
	}

	const current = state.deployment.list[state.deployment.current_id] || {};

	let ref_type_description = "";
	if (state.git.list[current.ref_type]) {
		ref_type_description = state.git.list[current.ref_type].description;
	}

	return {
		deployment: current,
		date_requested: current.date_requested_nice ? current.date_requested_nice : 'n/a',
		environment: state.environment.name,
		ref_type_description: ref_type_description
	};
};

const mapDispatchToProps = function() {
	return {};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(TargetReleaseRO);
