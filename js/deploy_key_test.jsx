var React = require("react");

var DeployKeyTest = React.createClass({

	getInitialState: function() {
		return {
			loading: false,
			tested: false,
			canAccessRepo: this.props.initialCanAccessRepo
		};
	},

	render: function() {

		if (this.props.deployKey) {
			var key = (
				<textarea
					className="vert readonly deploy-key"
					rows="6"
					readOnly
				>
					{this.props.deployKey}
				</textarea>
			);
		} else {
			var key = (
				<div className="alert alert-error">
					Something bad happened and we were not able to create your deploy key - support has been alerted.
					Please contact the helpdesk if the key does not appear on your stack page soon.
				</div>
			);
		}

		if(this.props.repoInterface == 'Github') {
			var deployKeyHelp = (
				<p>
					<i className="fa fa-github"></i> <a href="https://developer.github.com/guides/managing-deploy-keys/#deploy-keys" target="_blank">Deploy key help</a>
				</p>
			);
		}  else if (this.props.repoInterface == 'Bitbucket') {
			var deployKeyHelp = (
				<p>
					<i className="fa fa-bitbucket"></i> <a href="https://confluence.atlassian.com/bitbucket/use-deployment-keys-294486051.html" target="_blank">Deploy key help</a>
				</p>
			);
		} else if (this.props.repoInterface == 'Gitlab') {
			var deployKeyHelp = (
				<p>
					<img src="deploynaut/img/gitlab.png" alt="Gitlab" className="gitlab-icon" /> <a href="http://doc.gitlab.com/ce/ssh/README.html#deploy-keys" target="_blank">Deploy key help</a>
				</p>
			);
		} else {
			var deployKeyHelp = (
				<ul className="list-inline">
					<li><i className="fa fa-github"></i> <a href="https://developer.github.com/guides/managing-deploy-keys/#deploy-keys" target="_blank">Github</a></li>
					<li><i className="fa fa-bitbucket"></i> <a href="https://confluence.atlassian.com/bitbucket/use-deployment-keys-294486051.html" target="_blank">Bitbucket</a></li>
					<li><img src="deploynaut/img/gitlab.png" alt="Gitlab" className="gitlab-icon" /> <a href="http://doc.gitlab.com/ce/ssh/README.html#deploy-keys" target="_blank">Gitlab</a></li>
				</ul>
			);
		}

		return (
			<div className="add-deploy-key">
				<h2>One more thing...</h2>
				<div className="row">
					<div className="col-md-6 col-md-offset-3">
						<p>Whilst your environments are being built, please ensure we can access your private repositories by adding the deploy key below and testing access.</p>
						{deployKeyHelp}
					</div>
				</div>
				<div className="col-md-8 col-md-offset-2 text-left" id="deploy-key-test-holder">
					{key}
				</div>
				<div className="row">
					<div className="col-md-8 col-md-offset-2">
						{this.button()}
					</div>
				</div>
			</div>
		);
	},

	testAccess: function() {
		this.setState({ loading: true });
		var self = this;
		$.ajax({
			url: this.props.deployKeyTestUrl,
			dataType: 'json',
			cache: false,
			type: 'GET',
			success: function(data) {
				self.setState({
					loading: false,
					tested: true,
					canAccessRepo: data.canAccessRepo
				});
			}.bind(this),
			error: function(xhr, status, err) {
				self.setState({
					loading: false,
					tested: true,
					canAccesRepo: false
				});
			}.bind(this)
		});
	},

	handleTestAccess: function(e) {
		e.preventDefault();
		this.testAccess();
	},

	button: function() {
		var buttonText = { __html: 'Test Access' };
		var buttonDisabled = false;
		var buttonClass = 'btn btn-primary';
		if (!this.props.deployKey) {
			buttonDisabled = true;
			buttonClass = 'btn';
		} else if(this.state.loading) {
			buttonText = { __html: '<i class="fa fa-cog fa-spin"></i> Attempting to clone repository...' };
			buttonDisabled = true;
		} else if(this.state.canAccessRepo) {
			buttonText = { __html: '<i class="fa fa-check"></i> We can access your repository' };
			buttonDisabled = true;
			buttonClass = 'btn btn-success';
		}

		var msg;
		if(this.state.tested && !this.state.canAccessRepo && !this.state.loading) {
			msg = (
				<p className='alert alert-danger'>
					We're having trouble accessing your repository.
				</p>
			);
		}

		 var button = (
			<button href="#" className={buttonClass} onClick={this.handleTestAccess} disabled={buttonDisabled} dangerouslySetInnerHTML={buttonText}></button>
		);

		return (
			<div>
				{msg}
				{button}
			</div>
		);

	}

});

module.exports = DeployKeyTest;
