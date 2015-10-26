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
			var key = <pre className="deploy-key">{this.props.deployKey}</pre>;
		} else {
			var key = (
				<div className="alert alert-error">
					Something bad happened and we were not able to create your deploy key - support has been alerted.
					Please contact the helpdesk if the key does not appear on your stack page soon.
				</div>
			);
		}

		return (
			<div className="add-deploy-key">
				<h2>Add your deploy key...</h2>
				<div className="row">
					<div className="col-md-6 col-md-offset-3">
						<p>To give us access to your private repositories you will need to add the deploy key below. How you add this will differ depending on what platform you host your GIT repository on:</p>
						<ul className="list-inline">
							<li><i className="fa fa-github"></i> <a href="https://developer.github.com/guides/managing-deploy-keys/#deploy-keys" target="_blank">Github</a></li>
							<li><i className="fa fa-bitbucket"></i> <a href="https://confluence.atlassian.com/bitbucket/use-deployment-keys-294486051.html" target="_blank">Bitbucket</a></li>
							<li><img src="deploynaut/img/gitlab.png" alt="Gitlab" className="gitlab-icon" /> <a href="http://doc.gitlab.com/ce/ssh/README.html#deploy-keys" target="_blank">Gitlab</a></li>
						</ul>
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
