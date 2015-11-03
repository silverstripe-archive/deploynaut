var _ = require('underscore');
var DeployKeyTest = require('./deploy_key_test.jsx');

var external = {
	reloadSideMenu: function() {
		var navEl = $('.side-content .nav');
		if (navEl.length>0 && navEl.data('nav')) {
			$.get(navEl.data('nav'), function(data) {
				navEl.html(data);
			})
		}
	}
}

var CreateProjectProgress = React.createClass({

	checkInterval: false,

	getInitialState: function() {
		return {
			complete: false,
			checkingStatus: false,
			progress: {
				environments: {
					complete: [],
					inProgress: [],
					failed: []
				}
			}
		};
	},

	componentDidMount: function() {
		this.checkInterval = window.setInterval(this.handleCheckStatus, 10000);
	},

	componentWillUnmount: function() {
		if(this.checkInterval !== false) {
			window.clearInterval(this.checkInterval);
		}
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
					external.reloadSideMenu();
					self.setState({complete: true});
					window.clearInterval(this.checkInterval);
				}
				self.setState({
					checkingStatus: false,
					progress: data.progress
				});
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
				<DeployKeyTest deployKey={this.props.deployKey} initialCanAccessRepo={this.props.canAccessRepo} deployKeyTestUrl={this.props.deployKeyTestUrl} repoInterface={this.props.repoInterface} />
			);
		}

		if(this.state.complete) {
			// If no enivronments have built then we don't want to show the link to env page
			var successCount = Object.keys(this.state.progress.environments.complete).length;
			if(successCount == 0) {
				var environmentLinkText = 'Go to stack overview';
			} else {
				var environmentLinkText = 'Take me to my environments!';
			}

			var environmentLink = (
				<div className="col-md-12">
					<p>
						<a href={window.location.href} 
							onClick={this.reload} 
							className="btn btn-primary">{environmentLinkText}</a>
					</p>
				</div>
			);

			var failCount = Object.keys(this.state.progress.environments.failed).length;
			if(failCount > 0) {
				var failedList = _.map(this.state.progress.environments.failed, function(name) {
					return (
						<li>{name}</li>
					);
				});

				var completeMessage = (
					<div>
						<i className="fa fa-exclamation fa-5x text-danger"></i>
						<h1>Uh Oh!</h1>
						<p>Something went wrong and we had trouble creating your environments.</p>
						<p>Below is a list of environments which failed to build:</p>
						<div className="col-md-6 col-md-offset-3 text-left">
							<div className="alert alert-danger failed-environments">
								<ul>
									{failedList}
								</ul>
							</div>
						</div>
						{environmentLink}
					</div>
				);
			} else {
				var completeMessage = (
					<div>
						<i className="fa fa-check text-success fa-5x"></i>
						<h1>We're done!</h1>
						<p>Your environments are setup and ready to go!</p>
						{environmentLink}
					</div>
				);
			}

			return (
				<div className="row">
					{completeMessage}
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
					<div className="row">
						<div className="col-md-4 col-md-offset-4">
							<pre>{this.props.gitUrl}</pre>
						</div>
					</div>
					{deployKey}
				</div>
			);
		}
	}

});

module.exports = CreateProjectProgress;
