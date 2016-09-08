var React = require("react");
var ReactRedux = require('react-redux');

var Deploy = require('./buttons/Deploy.jsx');

var deployment = function(props) {
	var approverName = (props.approved_by) ? props.approved_by.name : "";
	var logOutput = null;

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
						<dd>{props.code_version}</dd>
						<dt>Approx deployment time</dt>
						<dd>{props.deployment_estimate}</dd>
					</dl>
				</div>
				<div className="col-md-6">
					<dl>
						<dt>Requested by</dt>
						<dd>{props.request_by.name}</dd>
						<dt>Approved by</dt>
						<dd>{approverName}</dd>
					</dl>
				</div>
			</div>
			<div>
				<Deploy sha={props.code_version} />
				{logOutput}
			</div>
		</div>
	);
};

const mapStateToProps = function(state) {
	var approvers = state.approval.approvers.filter(obj =>
		obj.id === parseInt(state.approval.approved_by, 10)
	);

	return {
		approved: state.approval.approved,
		bypassed: state.approval.bypassed,
		approved_by: approvers.shift(),
		request_by: state.approval.request_by,
		environment: state.environment.name,
		deployment_type: state.plan.deployment_type,
		deployment_estimate: state.plan.deployment_estimate,
		code_version: state.git.selected_ref,
		plan: state.plan,
		deploy_log: state.deployment.log
	};
};

const mapDispatchToProps = function() {
	return {};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(deployment);
