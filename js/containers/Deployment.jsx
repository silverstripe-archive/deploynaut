const React = require("react");
const ReactRedux = require('react-redux');
const actions = require('../_actions.js');
const constants = require('../constants/deployment.js');

const Deploy = require('./buttons/Deploy.jsx');
const LoadingBar = require('../components/LoadingBar.jsx');

const deployment = React.createClass({

	componentDidMount: function() {
		this.logUpdateInterval = setInterval(() => {
			this.props.updateLogs();
		}, 5 * 1000);
	},

	componentWillUnmount: function() {
		clearInterval(this.logUpdateInterval);
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

		if (this.props.started) {
			if (this.props.deploy_log) {
				const lines = Object.keys(this.props.deploy_log).map(function(key) {
					return <div key={key}>{this.props.deploy_log[key]}</div>;
				}.bind(this));
				logOutput = (
					<pre>
					{lines}
				</pre>
				);
			} else {
				logOutput = <LoadingBar show />
			}
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
	return {
		started: constants.hasDeployStarted(state.deployment.state),
		error: state.deployment.error,
		selected_ref: state.git.selected_ref,
		deploy_log: state.deployment.logs[state.deployment.id]
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
