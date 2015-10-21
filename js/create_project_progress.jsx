var DeployKeyTest = require('./deploy_key_test.jsx');

var CreateProjectProgress = React.createClass({

	checkInterval: false,

	getInitialState: function() {
		return {
			complete: false,
			checkingStatus: false
		};
	},

	componentDidMount: function() {
		this.checkInterval = window.setInterval(this.handleCheckStatus, 10000);
	},

	handleCheckStatus: function() {
		if(!this.state.checkingStatus) {
			this.checkStatus();
		}
	},

	checkStatus: function() {
		var self = this;
		$.ajax({
			url: this.props.statusUrl,
			dataType: 'json',
			cache: false,
			type: 'GET',
			success: function(data) {
				if(data.complete) {
					self.setState({complete: true});
					window.clearInterval(this.checkInterval);
				}
				self.setState({checkingStatus: false});
			}.bind(this),
			error: function(xhr, status, err) {
				self.setState({checkingStatus: false});
			}.bind(this)
		});
	},

	reload: function(e) {
		e.preventDefault();
		window.location.reload();
	},

	render: function() {
		if(!this.state.complete) {
			var deployKey = (
				<DeployKeyTest deployKey={this.props.deployKey} initialCanAccessRepo={this.props.canAccessRepo} deployKeyTestUrl={this.props.deployKeyTestUrl} />
			);
		}

		if(this.state.complete) {
			return (
				<div className="row">
					<i className="fa fa-check text-success fa-5x"></i>
					<h1>We're done!</h1>
					<p>Your environments are setup and ready to go!</p>
					<p><a href="#" onClick={this.reload} className="btn btn-primary">Take me to my environments!</a></p>
					{deployKey}
				</div>
			);
		} else {
			return (
				<div className="row">
					<div className="row progress-icon">
						<i className="fa fa-cog fa-spin fa-5x"></i>
					</div>

					<h1>Your environments are on their way!</h1>
					<p>We're currently building your environments which can take 15-45 minutes, depending on current traffic.</p>
					{deployKey}
				</div>
			);
		}
	}

});

module.exports = CreateProjectProgress;
