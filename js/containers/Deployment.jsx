const React = require("react");
const ReactRedux = require('react-redux');
const actions = require('../_actions.js');
const constants = require('../constants/deployment.js');

const Deploy = require('./buttons/Deploy.jsx');
const LoadingBar = require('../components/LoadingBar.jsx');
const Log = require('./Log.jsx');

const deployment = React.createClass({

	componentDidMount: function() {
		this.logUpdateInterval = setInterval(() => {
			this.props.updateLogs();
		}, 3000);
	},

	componentWillUnmount: function() {
		clearInterval(this.logUpdateInterval);
	},

	getLogContent: function() {
		if (typeof this.props.deploy_log === 'undefined') {
			return <LoadingBar show />;
		}
		return <Log content={this.props.deploy_log} />;
	},

	logUpdateInterval: null,

	render: function() {
		let error = null;
		if (this.props.error) {
			error = (
				<div className="alert alert-danger">
					<div className="">
						{this.props.error}
					</div>
				</div>
			);
		}

		let logOutput = null;

		if (this.props.deploy_started) {
			logOutput = this.getLogContent();
		}

		return (
			<div className="section deployment">
				{error}
				<div className="deploy-btn-container">
					<Deploy sha={this.props.selected_ref} />
				</div>
				<div>
					{logOutput}
				</div>
			</div>
		);
	}
});

const mapStateToProps = function(state) {
	const current = state.deployment.list[state.deployment.current_id] || {};
	return {
		deploy_started: constants.hasDeployStarted(current.state) || state.deployment.is_queuing,
		error: state.deployment.error,
		selected_ref: state.git.selected_ref,
		deploy_log: state.deployment.logs[state.deployment.current_id]
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		updateLogs: function() {
			dispatch(actions.getDeployLog());
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(deployment);
