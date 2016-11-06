const React = require("react");
const ReactRedux = require('react-redux');

const Deploy = require('./buttons/Deploy.jsx');

const deployment = function(props) {

	function shouldShowLogs() {
		if (typeof props.deploy_log === 'undefined') {
			return false;
		}
		return props.deploy_log.length > 0;
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
	if (shouldShowLogs()) {
		const lines = Object.keys(props.deploy_log).map(function(key) {
			return <div key={key}>{props.deploy_log[key]}</div>;
		});
		logOutput = (
			<pre>
				{lines}
			</pre>
		);
	}

	return (
		<div className="section deployment">
			{error}
			<div className="deploy-btn-container">
				<Deploy sha={props.selected_ref} />
			</div>
			<div>
				{logOutput}
			</div>
		</div>
	);
};

const mapStateToProps = function(state) {
	const approvers = state.deployment.approvers.filter(function(obj) {
		return obj.id === parseInt(state.deployment.approver_id, 10);
	});

	return {
		error: state.deployment.error,
		selected_ref: state.git.selected_ref,
		deploy_log: state.deployment.logs[state.deployment.id],
	};
};

const mapDispatchToProps = function() {
	return {};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(deployment);
