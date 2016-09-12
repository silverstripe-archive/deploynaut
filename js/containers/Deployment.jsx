const React = require("react");
const ReactRedux = require('react-redux');

const Deploy = require('./buttons/Deploy.jsx');

const deployment = function(props) {
	let approverName = "";

	if (props.approved_by && props.approved_by.name) {
		approverName = props.approved_by.name;
	}

	let error = null;
	if (props.error) {
		error = (
			<div className="alert alert-danger">
				<div className="">
					{props.error}
				</div>
			</div>
		);
	}

	let logOutput = null;
	if (props.deploy_log.length) {
		let lines = Object.keys(props.deploy_log).map(function(key) {
			return <div key={key}>{props.deploy_log[key]}</div>;
		});
		logOutput = (
			<pre>
				{lines}
			</pre>
		);
	}

	return (
		<div>
			<div className="row">
				<div className="col-md-6">
					<dl>
						<dt>Environment</dt>
						<dd>{props.environment}</dd>
						<dt>Deployment Type</dt>
						<dd>{props.deployment_type}</dd>
						<dt>Code version</dt>
						<dd>{props.selected_ref}</dd>
						<dt>Approx deployment time</dt>
						<dd>{props.deployment_estimate}</dd>
					</dl>
				</div>
				<div className="col-md-6">
					<dl>
						<dt>Approved by</dt>
						<dd>{approverName}</dd>
					</dl>
				</div>
			</div>
			{error}
			<div>
				<Deploy sha={props.selected_ref} />
				{logOutput}
			</div>
		</div>
	);
};

const mapStateToProps = function(state) {
	const approvers = state.approval.approvers.filter(obj =>
	obj.id === parseInt(state.approval.approved_by, 10)
);

	return {
		approved: state.approval.approved,
		bypassed: state.approval.bypassed,
		approved_by: approvers.shift(),
		environment: state.environment.name,
		deployment_type: state.plan.deployment_type,
		deployment_estimate: state.plan.deployment_estimate,
		selected_ref: state.git.selected_ref,
		plan: state.plan,
		deploy_log: state.deployment.log,
		error: state.deployment.error
	};
};

const mapDispatchToProps = function() {
	return {};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(deployment);
