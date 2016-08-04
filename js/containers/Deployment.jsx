var React = require("react");
var ReactRedux = require('react-redux');

var Deploy = require('./buttons/Deploy.jsx');

var deployment = function(props) {

	var approverName = (props.approvedBy) ? props.approvedBy.name : "";

	return (
		<div>
			<div className="row">
				<div className="col-md-6">
					<dl>
						<dt>Environment</dt>
						<dd>{props.environment}</dd>
						<dt>Deployment Type</dt>
						<dd>{props.deploymentType}</dd>
						<dt>Code version</dt>
						<dd>{props.codeVersion}</dd>
						<dt>Approx deployment time</dt>
						<dd>{props.deploymentEstimate}</dd>
					</dl>
				</div>
				<div className="col-md-6">
					<dl>
						<dt>Requested by</dt>
						<dd>{props.requestBy.name}</dd>
						<dt>Approved by</dt>
						<dd>{approverName}</dd>
					</dl>
				</div>
			</div>
			<div>
				<Deploy />
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
		approvedBy: approvers.shift(),
		requestBy: state.approval.request_by,
		environment: state.environment,
		deploymentType: state.deployment_type,
		deploymentEstimate: state.deployment_estimate,
		codeVersion: state.git.selected_ref
	};
};

const mapDispatchToProps = function() {
	return {};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(deployment);
