var Events = require('./events.js');
var Helpers = require('./helpers.js');
var DeployPlan = require('./deploy_plan.jsx');

var DeploymentDialog = React.createClass({

	loadingSub: null,

	loadingDoneSub: null,

	errorSub: null,

	getInitialState: function() {
		return {
			loading: false,
			loadingText: "",
			errorText: "",
			fetched: true,
			last_fetched: ""
		};
	},
	componentDidMount: function() {
		var self = this;
		// add subscribers
		this.loadingSub = Events.subscribe('loading', function(text) {
			self.setState({
				loading: true,
				success: false,
				loadingText: text
			});
		});
		this.loadingDoneSub = Events.subscribe('loading/done', function() {
			self.setState({
				loading: false,
				loadingText: '',
				success: true
			});
		});
		this.errorSub = Events.subscribe('error', function(text) {
			self.setState({
				errorText: text,
				loading: false,
				loadingText: '',
				success: false
			});
		});
	},
	componentWillUnmount: function() {
		// remove subscribers
		this.loadingSub.remove();
		this.loadingDoneSub.remove();
		this.errorSub.remove();
	},
	handleClick: function(e) {
		e.preventDefault();
		Events.publish('loading', "Fetching latest code…");
		this.setState({
			fetched: false
		});
		var self = this;
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.context.projectUrl + '/fetch'
		}))
			.then(this.waitForFetchToComplete, this.fetchStatusError)
			.then(function() {
				Events.publish('loading/done');
				self.setState({
					fetched: true
				})
			}).catch(this.fetchStatusError).done();
	},
	waitForFetchToComplete:function (fetchData) {
		var self = this;
		return this.getFetchStatus(fetchData).then(function (data) {
			if (data.status === "Complete") {
				return data;
			}
			if (data.status === "Failed") {
				return $.Deferred(function (d) {
					return d.reject(data);
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
		var message  = 'Unknown error';
		if(typeof data.responseText !== 'undefined') {
			message = data.responseText;
		} else if (typeof data.message !== 'undefined') {
			message = data.message;
		}
		Events.publish('error', message);
	},
	lastFetchedHandler: function(time_ago) {
		this.setState({last_fetched: time_ago});
	},
	render: function() {
		var classes = Helpers.classNames({
			"deploy-dropdown": true,
			"loading": this.state.loading,
			"success": this.state.success
		});

		var form;

		if(this.state.errorText !== "") {
			form = <ErrorMessages message={this.state.errorText} />
		} else if(this.state.fetched) {
			form = <DeployForm context={this.props.context} data={this.props.data} lastFetchedHandler={this.lastFetchedHandler} />
		} else if (this.state.loading) {
			form = <LoadingDeployForm message="Fetching latest code&hellip;" />
		}

		return (
			<div>
				<div className={classes} onClick={this.handleClick}>
					<span className="status-icon" aria-hidden="true"></span>
					<span className="time">last updated {this.state.last_fetched}</span>
					<EnvironmentName environmentName={this.props.context.envName} />
				</div>
				{form}
			</div>
		);
	}
});

var LoadingDeployForm = React.createClass({
	render: function() {
		return (
			<div className="deploy-form-loading">
				<div className="icon-holder">
					<i className="fa fa-cog fa-spin"></i>
					<span>{this.props.message}</span>
				</div>
			</div>
		);
	}
});

var ErrorMessages = React.createClass({
	render: function() {
		return (
			<div className="deploy-dropdown-errors">
				{this.props.message}
			</div>
		)
	}
});

/**
 * EnvironmentName
 */
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

/**
 * DeployForm
 */
var DeployForm = React.createClass({
	getInitialState: function() {
		return {
			selectedTab: 1,
			data: []
		};
	},
	componentDidMount: function() {
		this.gitData();
	},

	gitData: function() {
		var self = this;
		self.setState({
			loading: true
		});
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.context.envUrl + '/git_revisions'
		})).then(function(data) {
			self.setState({
				loading: false,
				data: data.Tabs
			});
			self.props.lastFetchedHandler(data.last_fetched);
		}, function(data){
			Events.publish('error', data);
		});
	},

	selectHandler: function(id) {
		this.setState({selectedTab: id});
	},
	render: function () {
		if(this.state.loading) {
			return (
				<LoadingDeployForm message="Loading&hellip;" />
			);
		}

		return (
			<div className="deploy-form-outer clearfix">
				<form className="form-inline deploy-form" action="POST" action="#">
					<DeployTabSelector data={this.state.data} onSelect={this.selectHandler} selectedTab={this.state.selectedTab} />
					<DeployTabs context={this.props.context} data={this.state.data} selectedTab={this.state.selectedTab} SecurityToken={this.state.SecurityToken} />
				</form>
			</div>
		);
	}
});

/**
 * DeployTabSelector
 */
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

/**
 * DeployTabSelect
 */
var DeployTabSelect = React.createClass({
	handleClick: function(e) {
		e.preventDefault();
		this.props.onSelect(this.props.tab.id)
	},
	render: function () {
		var classes = Helpers.classNames({
			"active" : (this.props.selectedTab == this.props.tab.id)
		});
		return (
			<li className={classes}>
				<a onClick={this.handleClick} href={"#deploy-tab-"+this.props.tab.id} >{this.props.tab.name}</a>
			</li>
		);
	}

});

/**
 * DeployTabs
 */
var DeployTabs = React.createClass({
	render: function () {
		var self = this;
		var tabs = this.props.data.map(function(tab) {
			return (
				<DeployTab context={self.props.context} key={tab.id} tab={tab} selectedTab={self.props.selectedTab} SecurityToken={self.props.SecurityToken} />
			);
		});

		return (
			<div className="tab-content">
				{tabs}
			</div>
		);
	}
});

/**
 * DeployTab
 */
var DeployTab = React.createClass({
	getInitialState: function() {
		return {
			summary: this.getInitialSummaryState(),
			options: {},
			sha: ''
		};
	},
	getInitialSummaryState: function() {
		return {
			changes: {},
			messages: [],
			validationCode: '',
			estimatedTime: null,
			actionCode: null,
			initialState: true
		}
	},
	OptionChangeHandler: function(event) {
		var options = this.state.options;
		options[event.target.name] = event.target.checked;
		this.setState({
			options: options
		});
	},
	SHAChangeHandler: function(event) {
		this.setState({
			sha: event.target.value
		});
	},
	changeHandler: function(event) {
		event.preventDefault();

		this.setState({
			summary: this.getInitialSummaryState()
		});

		if(event.target.value === "") {
			return;
		}

		Events.publish('change_loading');

		var summaryData = {
			sha: React.findDOMNode(this.refs.sha_selector.refs.sha).value,
			SecurityID: this.props.SecurityToken
		};
		// merge the 'advanced' options if they are set
		for (var attrname in this.state.options) {
			if(this.state.options.hasOwnProperty(attrname)) {
				summaryData[attrname] = this.state.options[attrname];
			}
		}
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.context.envUrl + '/deploy_summary',
			data: summaryData
		})).then(function(data) {
			this.setState({
				summary: data
			});
			Events.publish('change_loading/done');
		}.bind(this), function(){
			Events.publish('change_loading/done');
		});
	},

	showOptions: function() {
		return this.props.tab.advanced_opts === 'true';
	},

	showVerifyButton: function() {
		if(this.showOptions()) {
			return true;
		}
		return this.props.tab.field_type == 'textfield';
	},

	shaChosen: function() {
		return (this.state.sha !== '');
	},

	render: function () {
		var classes = Helpers.classNames({
			"tab-pane": true,
			"clearfix": true,
			"active" : (this.props.selectedTab == this.props.tab.id)
		});

		// setup the dropdown or the text input for selecting a SHA
		var selector;
		if (this.props.tab.field_type == 'dropdown') {
			var changeHandler = this.changeHandler;
			if(this.showVerifyButton()) { changeHandler = this.SHAChangeHandler }
			selector = <SelectorDropdown ref="sha_selector" tab={this.props.tab} changeHandler={changeHandler} />
		} else if (this.props.tab.field_type == 'textfield') {
			selector = <SelectorText ref="sha_selector" tab={this.props.tab} changeHandler={this.SHAChangeHandler} />
		}

		// 'Advanced' options
		var options = null;
		if(this.showOptions()) {
			options = <AdvancedOptions tab={this.props.tab} changeHandler={this.OptionChangeHandler} />
		}

		// 'The verify button'
		var verifyButton = null;
		if(this.showVerifyButton()) {
			verifyButton = <VerifyButton disabled={!this.shaChosen()} changeHandler={this.changeHandler} />
		}

		return (
			<div id={"deploy-tab-"+this.props.tab.id} className={classes}>
				<div className="section">
					<div htmlFor={this.props.tab.field_id} className="header">
						<span className="numberCircle">1</span> {this.props.tab.field_label}
					</div>
					{selector}
					{options}
					{verifyButton}
				</div>
				<DeployPlan context={this.props.context} summary={this.state.summary} />
			</div>
		);
	}
});

var SelectorDropdown = React.createClass({
	componentDidMount: function() {
		$(React.findDOMNode(this.refs.sha)).select2({
			// Load data into the select2.
			// The format supports optgroups, and looks like this:
			// [{text: 'optgroup text', children: [{id: '<sha>', text: '<inner text>'}]}]
			data: this.props.tab.field_data
		});

		// Trigger handler only needed if there is no explicit button.
		if(this.props.changeHandler) {
			$(React.findDOMNode(this.refs.sha)).select2().on("change", this.props.changeHandler);
		}
	},

	render: function() {
		// From https://select2.github.io/examples.html "The best way to ensure that Select2 is using a percent based
		// width is to inline the style declaration into the tag".
		var style = {width: '100%'};

		return (
			<div>
				<div className="field">
					<select
						ref="sha"
						id={this.props.tab.field_id}
						name="sha"
						className="dropdown"
						onChange={this.props.changeHandler}
						style={style}>
						<option value="">Select {this.props.tab.field_id}</option>
					</select>
				</div>
			</div>
		);
	}
});

var SelectorText = React.createClass({
	render: function() {
		return(
			<div className="field">
				<input
					type="text"
					ref="sha"
					id={this.props.tab.field_id}
					name="sha"
					className="text"
					onChange={this.props.changeHandler}
				/>
			</div>
		);
	}
});

var VerifyButton = React.createClass({
	render: function() {
		return (
			<div className="">
				<button
					disabled={this.props.disabled}
					value="Verify deployment"
					className="btn btn-default"
					onClick={this.props.changeHandler}>
					Verify deployment
				</button>
			</div>
		);
	}
});

var AdvancedOptions = React.createClass({
	render: function () {
		return (
			<div className="deploy-options">
				<div className="fieldcheckbox">
					<label>
						<input
							type="checkbox"
							name="force_full"
							onChange={this.props.changeHandler}
						/>
						Force full deployment
					</label>
				</div>
			</div>
		);
	}
});

module.exports = DeploymentDialog;
