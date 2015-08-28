function classNames () {

	var classes = '';

	for (var i = 0; i < arguments.length; i++) {
		var arg = arguments[i];
		if (!arg) continue;

		var argType = typeof arg;

		if ('string' === argType || 'number' === argType) {
			classes += ' ' + arg;

		} else if (Array.isArray(arg)) {
			classes += ' ' + classNames.apply(null, arg);

		} else if ('object' === argType) {
			for (var key in arg) {
				if (arg.hasOwnProperty(key) && arg[key]) {
					classes += ' ' + key;
				}
			}
		}
	}
	return classes.substr(1);
}

var DeployDropDown = React.createClass({
	getInitialState: function() {
		return {
			loading: false,
			loaded: false,
			opened: false,
			loadingText: ""
		};
	},
	componentDidMount: function() {

	},
	handleClick: function(e) {
		e.preventDefault();
		this.setState({
			loading: true,
			success: false,
			opened: false,
			loadingText: "Fetching latest code…"
		});
		var self = this;
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.project_url + '/fetch'
		}))
			.then(this.waitForFetchToComplete, this.fetchStatusError)
			.then(function() {
				self.setState({
					loading: false,
					loadingText: '',
					success: true,
					opened: true
				});
			}).catch(function(data){
				console.log('omg everything is broken');
				console.error(data);
			}).done();
	},
	waitForFetchToComplete:function (fetchData) {
		var self = this;
		return this.getFetchStatus(fetchData).then(function (data) {
			if (data.status === "Complete") {
				return data;
			}
			if (data.status === "Failed") {
				return $.Deferred(function (d) {
					return d.reject();
				}).promise();
			}
			return self.waitForFetchToComplete(fetchData);
		});
	},
	getFetchStatus: function (fetchData) {
		return Q($.ajax({
			type: "GET",
			url: fetchData.href,
			dataType: 'json'
		}));
	},
	fetchStatusError: function(data) {
		console.error(data);
	},
	render: function() {
		var classes = classNames({
			"deploy-dropdown": true,
			"loading": this.state.loading,
			"open": this.state.opened,
			"success": this.state.success
		});
		return (
			<div>
				<div className={classes} onClick={this.handleClick}>
					<span className="status-icon" aria-hidden="true"></span>
					<span className="loading-text">{this.state.loadingText}</span>
					<EnvironmentName environmentName="cb-web-a" />
				</div>
				<DeployForm data={this.props.data} env_url={this.props.env_url}/>
			</div>
		);
	}
});

var EnvironmentName = React.createClass({
	render: function () {
		return (
			<span className="environment-name">
				<i className="fa fa-rocket">&nbsp;</i>
				Deployment options <span className="hidden-xs">for {this.props.environmentName}</span>
			</span>
		);
	}
});

var DeployForm = React.createClass({
	getInitialState: function() {
		return {
			selectedTab: 1,
			data: [],
		};
	},
	componentDidMount: function() {
		this.gitData();
	},

	gitData: function() {
		var self = this;
		 Q($.ajax({
		    type: "POST",
			 dataType: 'json',
			 url: this.props.env_url + '/git_revisions'
		 })).then(function(data) {
			self.setState({
				data: data
			});
		 }, function(data){
			 console.error(data);
		 });
	},

	selectHandler: function(id) {
		this.setState({selectedTab: id});
	},
	render: function () {
		return (
			<div className="deploy-form-outer clearfix collapse in">
			<form className="form-inline deploy-form" action="POST" action="naut/project/cloudbusters/environment/cb-web-a-fast/start-deploy">
			<DeployTabSelector data={this.state.data} onSelect={this.selectHandler} selectedTab={this.state.selectedTab} />
			<DeployTabs data={this.state.data} selectedTab={this.state.selectedTab} env_url={this.props.env_url} />
			</form>
			</div>
		);
	}
});

var DeployTabSelector = React.createClass({

	render: function () {
		var self = this;
		var selectors = this.props.data.map(function(tab) {
			return (
				<DeployTabSelect key={tab.id} tab={tab} onSelect={self.props.onSelect} selectedTab={self.props.selectedTab} />
			);
		});
		return (
			<ul className="SelectionGroup tabbedselectiongroup nolabel">
			{selectors}
			</ul>

		);
	}
});

var DeployTabSelect = React.createClass({
	handleClick: function(e) {
		e.preventDefault();
		this.props.onSelect(this.props.tab.id)
	},
	render: function () {
		var classes = classNames({
			"active" : (this.props.selectedTab == this.props.tab.id)
		});
		return (
			<li className={classes}>
				<a onClick={this.handleClick} href={"#deploy-tab-"+this.props.tab.id} data-value={this.props.tab.type}>{this.props.tab.name}</a>
			</li>
		);
	}
});

var DeployTabs = React.createClass({
	render: function () {
		var self = this;
		var tabs = this.props.data.map(function(tab) {
			return (
				<DeployTab key={tab.id} tab={tab}  selectedTab={self.props.selectedTab} env_url={self.props.env_url} />
			);
		});

		return (
			<div className="tab-content">
				{tabs}
			</div>
		);
	}
});

var DeployTab = React.createClass({
	getInitialState: function() {
		return {
			summary: {
				changes: []
			}
		};
	},
	selectChangeHandler: function(event) {
		var self = this;
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.env_url + '/deploy_summary',
			data: {'sha': event.target.value}

		})).then(function(data) {
			self.setState({
				summary: data
			});
			console.log(self.state);
		}, function(data){
			console.error(data);
		});
	},

	render: function () {
		var classes = classNames({
			"tab-pane": true,
			"clearfix": true,
			"active" : (this.props.selectedTab == this.props.tab.id)
		});
		var id = 0;
		var options = this.props.tab.field_data.map(function(data) {
			id++;
			return (
				<option key={id} value={data.value}>{data.name}</option>
			);
		});
		return (
			<div id={"deploy-tab-"+this.props.tab.id} className={classes}>
				{this.props.tab.name}
				<select name="Branch" className="dropdown" onChange={this.selectChangeHandler} >
					<option>Select something</option>
					{options}
				</select>
				<DeployPlan summary={this.state.summary} env_url={this.props.env_url} />
			</div>
		);
	}
});

var DeployPlan = React.createClass({
	submitHandler: function(event) {
		event.preventDefault();
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.env_url + '/start-deploy',
			data: this.props.summary
		})).then(function(data) {
			window.location = data.url;
		}, function(data){
			console.error(data);
		});
	},
	render: function() {

		var changes = this.props.summary.changes;
		var canDeploy = true;
		var i = 0;
		var summaryLines = Object.keys(changes).map(function(key) {
			i++;
			return (
				<SummaryLine key={i} name={key} value={changes[key].to} />
			)
		});
		return(
			<div>
				<label>Review Details</label>
				<div>
				{summaryLines}
				</div>
				<div>
					<button value="Deploy to cb-web-a-fast" className="action btn btn-primary deploy-button" disabled={!canDeploy} onClick={this.submitHandler}>Deploy</button>
				</div>
			</div>
		)
	}
});

var SummaryLine = React.createClass({
	render: function() {
		return (
			<div>{this.props.name}: {this.props.value}</div>
		)
	}
});

React.render(
	<DeployDropDown project_url={urls.project_url} env_url={urls.env_url} />,
	document.getElementById('deploy_form')
);


