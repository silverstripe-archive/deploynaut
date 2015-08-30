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
					<EnvironmentName environmentName="" />
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
			<form className="form-inline deploy-form" action="POST" action="#">
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
				<a onClick={this.handleClick} href={"#deploy-tab-"+this.props.tab.id} >{this.props.tab.name}</a>
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
				changes: null,
				validationCode: '',
				estimatedTime: null,
				initialState: true,
			},
		};
	},
	componentDidMount: function() {
		$(React.findDOMNode(this.refs.sha_selector)).select2().on("change", this.selectChangeHandler);
	},
	selectChangeHandler: function(event) {

		if(event.target.value === "") {
			this.setState(this.getInitialState());
			console.log('reset');
			return;
		}

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
				<div className="section">
					<label htmlFor={this.props.tab.field_id} ><span className="numberCircle">1</span> {this.props.tab.field_label}</label>
					<div className="field">
						<select ref="sha_selector" id={this.props.tab.field_id} name="sha" className="dropdown" onChange={this.selectChangeHandler} >
							<option value="">Select {this.props.tab.field_id}</option>
							{options}
						</select>
					</div>
				</div>
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
		var errors = this.props.summary.errors;
		var canDeploy = (this.props.summary.validationCode === "success");

		var errorMessages = [];
		if (errors && errors.length>0) {
			errorMessages = errors.map(function(message) {
				return (
					<div className="alert alert-danger" role="alert">{message}</div>
				)
			});
		}

		if (this.props.summary.changes) {
			var changeBlock = <SummaryTable changes={this.props.summary.changes} />
		} else if (!this.props.summary.initialState && errorMessages.length===0) {
			var changeBlock = <div className="alert alert-info" role="alert">There are no changes but you can deploy anyway if you wish.</div>
		}

		return(
			<div>
				<div className="section">
					<label><span className="numberCircle">2</span> Review changes</label>
					{errorMessages}
					{changeBlock}
				</div>
				<div className="section">
					<button
						value="Confirm Deployment"
						className="action btn btn-primary deploy-button"
						disabled={!canDeploy}
						onClick={this.submitHandler}>
							{this.props.summary.actionTitle ? this.props.summary.actionTitle : 'Make a selection'}<br/>
							<EstimatedTime estimatedTime={this.props.summary.estimatedTime} />
					</button>
				</div>
			</div>
		)
	}
});

var EstimatedTime = React.createClass({
	render: function() {
		var estimatedTime = this.props.estimatedTime;
		if (estimatedTime && estimatedTime>0) {
			return (
				<small>Approx. {estimatedTime} min</small>
			);
		}

		return null;
	}
});

var SummaryTable = React.createClass({
	render: function() {
		var i = 0;
		var changes = this.props.changes;

		var summaryLines = Object.keys(changes).map(function(key) {
			i++;
			return (
				<SummaryLine key={i} name={key} from={changes[key].from} to={changes[key].to} />
			)
		});

		return (
			<table className="table table-striped table-hover">
				<thead>
					<tr>
						<th></th>
						<th>From</th>
						<th>To</th>
					</tr>
				</thead>
				<tbody>
					{summaryLines}
				</tbody>
			</table>
		);
	}
});

var SummaryLine = React.createClass({
	render: function() {
		var from = this.props.from.substring(0,30);
		var to = this.props.to.substring(0,30);
		return (
			<tr>
				<th scope="row">{this.props.name}</th><td>{from}</td><td>{to}</td>
			</tr>
		)
	}
});

React.render(
	<DeployDropDown project_url={urls.project_url} env_url={urls.env_url} />,
	document.getElementById('deploy_form')
);


