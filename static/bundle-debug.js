(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var DeploymentDialog = require('./deployment_dialog.jsx');
var CreateProjectProgress = require('./create_project_progress.jsx');

// Mount the component only on the page where the holder is actually present.
var holder = document.getElementById('deployment-dialog-holder');
if (holder) {
	React.render(
		React.createElement(DeploymentDialog, {context: environmentConfigContext}),
		holder
	);
}

var createProjectProgressHolder = document.getElementById('create-project-progress-holder');
if(createProjectProgressHolder) {
	React.render(
		React.createElement(CreateProjectProgress, {statusUrl: createProjectStatusUrl, 
	   		deployKey: deployKey, 
			deployKeyTestUrl: deployKeyTestUrl, 
			initalCanAccessRepo: canAccessRepo}	),
		createProjectProgressHolder
	);
}

},{"./create_project_progress.jsx":2,"./deployment_dialog.jsx":5}],2:[function(require,module,exports){
var DeployKeyTest = require('./deploy_key_test.jsx');

var CreateProjectProgress = React.createClass({displayName: "CreateProjectProgress",

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
				React.createElement(DeployKeyTest, {deployKey: this.props.deployKey, initialCanAccessRepo: this.props.canAccessRepo, deployKeyTestUrl: this.props.deployKeyTestUrl})
			);
		}

		if(this.state.complete) {
			return (
				React.createElement("div", {className: "row"}, 
					React.createElement("i", {className: "fa fa-check text-success fa-5x"}), 
					React.createElement("h1", null, "We're done!"), 
					React.createElement("p", null, "Your environments are setup and ready to go!"), 
					React.createElement("p", null, React.createElement("a", {href: "#", onClick: this.reload, className: "btn btn-primary"}, "Take me to my environments!")), 
					deployKey
				)
			);
		} else {
			return (
				React.createElement("div", {className: "row"}, 
					React.createElement("div", {className: "row progress-icon"}, 
						React.createElement("i", {className: "fa fa-cog fa-spin fa-5x"})
					), 

					React.createElement("h1", null, "Your environments are on their way!"), 
					React.createElement("p", null, "We're currently building your environments which can take 15-45 minutes, depending on current traffic."), 
					deployKey
				)
			);
		}
	}

});

module.exports = CreateProjectProgress;

},{"./deploy_key_test.jsx":3}],3:[function(require,module,exports){
var DeployKeyTest = React.createClass({displayName: "DeployKeyTest",

	getInitialState: function() {
		return {
			loading: false,
			tested: false,
			canAccessRepo: this.props.initialCanAccessRepo
		};
	},

	render: function() {
		return (
			React.createElement("div", {className: "add-deploy-key"}, 
				React.createElement("h2", null, "Add your deploy key..."), 
				React.createElement("div", {className: "row"}, 
					React.createElement("div", {className: "col-md-6 col-md-offset-3"}, 
						React.createElement("p", null, "To give us access to your private repositories you will need to add the deploy key below. How you add this will differ depending on what platform you host your GIT repository on:"), 
						React.createElement("ul", {className: "list-inline"}, 
							React.createElement("li", null, React.createElement("i", {className: "fa fa-github"}), " ", React.createElement("a", {href: "https://developer.github.com/guides/managing-deploy-keys/#deploy-keys", target: "_blank"}, "Github")), 
							React.createElement("li", null, React.createElement("i", {className: "fa fa-bitbucket"}), " ", React.createElement("a", {href: "https://confluence.atlassian.com/bitbucket/use-deployment-keys-294486051.html", target: "_blank"}, "Bitbucket")), 
							React.createElement("li", null, React.createElement("img", {src: "deploynaut/img/gitlab.png", alt: "Gitlab", className: "gitlab-icon"}), " ", React.createElement("a", {href: "http://doc.gitlab.com/ce/ssh/README.html#deploy-keys", target: "_blank"}, "Gitlab"))
						)
					)
				), 
				React.createElement("div", {className: "col-md-8 col-md-offset-2 text-left", id: "deploy-key-test-holder"}, 
					React.createElement("pre", {className: "deploy-key"}, this.props.deployKey)
				), 
				React.createElement("div", {className: "row"}, 
					React.createElement("div", {className: "col-md-8 col-md-offset-2"}, 
						this.button()
					)
				)
			)
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
				console.log(data.canAccessRepo);
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
		if(this.state.loading) {
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
				React.createElement("p", {className: "alert alert-danger"}, 
					"We're having trouble accessing your repository."
				)
			);
		}

		 var button = (
			React.createElement("button", {href: "#", className: buttonClass, onClick: this.handleTestAccess, disabled: buttonDisabled, dangerouslySetInnerHTML: buttonText})
		);

		return (
			React.createElement("div", null, 
				msg, 
				button
			)
		);

	}

});

module.exports = DeployKeyTest;

},{}],4:[function(require,module,exports){
var Events = require('./events.js');
var Helpers = require('./helpers.js');
var SummaryTable = require('./summary_table.jsx');

var DeployPlan = React.createClass({displayName: "DeployPlan",
	loadingSub: null,
	loadingDoneSub: null,
	getInitialState: function() {
		return {
			loading_changes: false,
			deploy_disabled: false,
			deployHover: false
		}
	},
	componentDidMount: function() {
		var self = this;
		// register subscribers
		this.loadingSub = Events.subscribe('change_loading', function () {
			self.setState({
				loading_changes: true
			});
		});
		this.loadingDoneSub = Events.subscribe('change_loading/done', function () {
			self.setState({
				loading_changes: false
			});
		});
	},
	deployHandler: function(event) {
		event.preventDefault();
		this.setState({
			deploy_disabled: true
		});

		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.context.envUrl + '/start-deploy',
			data: {
				// Pass the strategy object the user has just signed off back to the backend.
				'strategy': this.props.summary,
				'SecurityID': this.props.summary.SecurityID
			}
		})).then(function(data) {
			window.location = data.url;
		}, function(data){
			console.error(data);
		});
	},
	mouseEnterHandler: function(event) {
		this.setState({deployHover: true});
	},
	mouseLeaveHandler: function(event) {
		this.setState({deployHover: false});
	},
	canDeploy: function() {
		return (this.props.summary.validationCode==="success" || this.props.summary.validationCode==="warning");
	},
	isEmpty: function(obj) {
		for (var key in obj) {
			if (obj.hasOwnProperty(key) && obj[key]) {
				return false;
			}
		}
		return true;
	},
	showNoChangesMessage: function() {
		var summary = this.props.summary;
		if(summary.initialState === true) {
			return false;
		}
		if(summary.messages === 'undefined') {
			return true;
		}
		return (this.isEmpty(summary.changes) && summary.messages.length === 0);
	},
	actionTitle: function() {
		var actionTitle = this.props.summary.actionTitle;
		if (typeof actionTitle === 'undefined' || actionTitle === '' ) {
			return 'Make a selection';
		}
		return this.props.summary.actionTitle;
	},
	render: function() {
		var messages = this.props.summary.messages;
		if (this.showNoChangesMessage()) {
			messages = [{
				text: "There are no changes but you can deploy anyway if you wish.",
				code: "success"
			}];
		}

		var deployAction;
		if(this.canDeploy()) {
			deployAction = (
				React.createElement("div", {className: "section", 
					onMouseEnter: this.mouseEnterHandler, 
					onMouseLeave: this.mouseLeaveHandler}, 
						React.createElement("button", {
							value: "Confirm Deployment", 
							className: "deploy pull-left", 
							disabled: this.state.deploy_disabled, 
							onClick: this.deployHandler}, 
							this.actionTitle()
						), 
						React.createElement(QuickSummary, {activated: this.state.deployHover, context: this.props.context, summary: this.props.summary})
				)
			);
		}

		var headerClasses = Helpers.classNames({
			header: true,
			inactive: !this.canDeploy(),
			loading: this.state.loading_changes
		});

		return(
			React.createElement("div", null, 
				React.createElement("div", {className: "section"}, 
					React.createElement("div", {className: headerClasses}, 
						React.createElement("span", {className: "status-icon"}), 
						React.createElement("span", {className: "numberCircle"}, "2"), " Review changes"
					), 
					React.createElement(MessageList, {messages: messages}), 
					React.createElement(SummaryTable, {changes: this.props.summary.changes})
				), 
				deployAction
			)
		)
	}
});

var QuickSummary = React.createClass({displayName: "QuickSummary",
	render: function() {
		var type = (this.props.summary.actionCode==='fast' ? 'code-only' : 'full');
		var estimate = [];
		if (this.props.summary.estimatedTime && this.props.summary.estimatedTime>0) {
			estimate = [
				React.createElement("dt", null, "Duration:"),
				React.createElement("dd", null, this.props.summary.estimatedTime, " min approx.")
			];
		}

		var dlClasses = Helpers.classNames({
			activated: this.props.activated,
			'quick-summary': true
		});

		var moreInfo = null;
		if (typeof this.props.context.deployHelp!=='undefined' && this.props.context.deployHelp) {
			moreInfo = (
				React.createElement("a", {target: "_blank", className: "small", href: this.props.context.deployHelp}, "more info")
			);
		}

		if (this.props.context.siteUrl) {
			var env = React.createElement("a", {target: "_blank", href: this.props.context.siteUrl}, this.props.context.envName);
		} else {
			var env = React.createElement("span", null, this.props.context.envName);
		}

		return (
			React.createElement("dl", {className: dlClasses}, 
				React.createElement("dt", null, "Environment:"), 
				React.createElement("dd", null, env), 
				React.createElement("dt", null, "Deploy type:"), 
				React.createElement("dd", null, type, " ", moreInfo), 
				estimate
			)
		);
	}
});

var MessageList = React.createClass({displayName: "MessageList",
	render: function() {
		if(this.props.messages.length < 1) {
			return null;
		}
		if(typeof this.props.messages === 'undefined') {
			return null;
		}
		var idx = 0;
		var messages = this.props.messages.map(function(message) {
			idx++;
			return React.createElement(Message, {key: idx, message: message})
		});
		return (
			React.createElement("div", null, 
				messages
			)
		)
	}
});

var Message = React.createClass({displayName: "Message",
	render: function() {
		var classMap = {
			'error': 'alert alert-danger',
			'warning': 'alert alert-warning',
			'success': 'alert alert-info'
		};
		var classname=classMap[this.props.message.code];
		return (
			React.createElement("div", {className: classname, role: "alert", 
				dangerouslySetInnerHTML: {__html: this.props.message.text}})
		)
	}
});

module.exports = DeployPlan;

},{"./events.js":6,"./helpers.js":7,"./summary_table.jsx":8}],5:[function(require,module,exports){
var Events = require('./events.js');
var Helpers = require('./helpers.js');
var DeployPlan = require('./deploy_plan.jsx');

var DeploymentDialog = React.createClass({displayName: "DeploymentDialog",

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
			form = React.createElement(ErrorMessages, {message: this.state.errorText})
		} else if(this.state.fetched) {
			form = React.createElement(DeployForm, {context: this.props.context, data: this.props.data, lastFetchedHandler: this.lastFetchedHandler})
		} else if (this.state.loading) {
			form = React.createElement(LoadingDeployForm, {message: "Fetching latest code…"})
		}

		return (
			React.createElement("div", null, 
				React.createElement("div", {className: classes, onClick: this.handleClick}, 
					React.createElement("span", {className: "status-icon", "aria-hidden": "true"}), 
					React.createElement("span", {className: "time"}, "last updated ", this.state.last_fetched), 
					React.createElement(EnvironmentName, {environmentName: this.props.context.envName})
				), 
				form
			)
		);
	}
});

var LoadingDeployForm = React.createClass({displayName: "LoadingDeployForm",
	render: function() {
		return (
			React.createElement("div", {className: "deploy-form-loading"}, 
				React.createElement("div", {className: "icon-holder"}, 
					React.createElement("i", {className: "fa fa-cog fa-spin"}), 
					React.createElement("span", null, this.props.message)
				)
			)
		);
	}
});

var ErrorMessages = React.createClass({displayName: "ErrorMessages",
	render: function() {
		return (
			React.createElement("div", {className: "deploy-dropdown-errors"}, 
				this.props.message
			)
		)
	}
});

/**
 * EnvironmentName
 */
var EnvironmentName = React.createClass({displayName: "EnvironmentName",
	render: function () {
		return (
			React.createElement("span", {className: "environment-name"}, 
				React.createElement("i", {className: "fa fa-rocket"}, " "), 
				"Deployment options ", React.createElement("span", {className: "hidden-xs"}, "for ", this.props.environmentName)
			)
		);
	}
});

/**
 * DeployForm
 */
var DeployForm = React.createClass({displayName: "DeployForm",
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
				React.createElement(LoadingDeployForm, {message: "Loading…"})
			);
		}

		return (
			React.createElement("div", {className: "deploy-form-outer clearfix"}, 
				React.createElement("form", {className: "form-inline deploy-form", action: "POST", action: "#"}, 
					React.createElement(DeployTabSelector, {data: this.state.data, onSelect: this.selectHandler, selectedTab: this.state.selectedTab}), 
					React.createElement(DeployTabs, {context: this.props.context, data: this.state.data, selectedTab: this.state.selectedTab, SecurityToken: this.state.SecurityToken})
				)
			)
		);
	}
});

/**
 * DeployTabSelector
 */
var DeployTabSelector = React.createClass({displayName: "DeployTabSelector",
	render: function () {
		var self = this;
		var selectors = this.props.data.map(function(tab) {
			return (
				React.createElement(DeployTabSelect, {key: tab.id, tab: tab, onSelect: self.props.onSelect, selectedTab: self.props.selectedTab})
			);
		});
		return (
			React.createElement("ul", {className: "SelectionGroup tabbedselectiongroup nolabel"}, 
				selectors
			)
		);
	}
});

/**
 * DeployTabSelect
 */
var DeployTabSelect = React.createClass({displayName: "DeployTabSelect",
	handleClick: function(e) {
		e.preventDefault();
		this.props.onSelect(this.props.tab.id)
	},
	render: function () {
		var classes = Helpers.classNames({
			"active" : (this.props.selectedTab == this.props.tab.id)
		});
		return (
			React.createElement("li", {className: classes}, 
				React.createElement("a", {onClick: this.handleClick, href: "#deploy-tab-"+this.props.tab.id}, this.props.tab.name)
			)
		);
	}

});

/**
 * DeployTabs
 */
var DeployTabs = React.createClass({displayName: "DeployTabs",
	render: function () {
		var self = this;
		var tabs = this.props.data.map(function(tab) {
			return (
				React.createElement(DeployTab, {context: self.props.context, key: tab.id, tab: tab, selectedTab: self.props.selectedTab, SecurityToken: self.props.SecurityToken})
			);
		});

		return (
			React.createElement("div", {className: "tab-content"}, 
				tabs
			)
		);
	}
});

/**
 * DeployTab
 */
var DeployTab = React.createClass({displayName: "DeployTab",
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
			selector = React.createElement(SelectorDropdown, {ref: "sha_selector", tab: this.props.tab, changeHandler: changeHandler})
		} else if (this.props.tab.field_type == 'textfield') {
			selector = React.createElement(SelectorText, {ref: "sha_selector", tab: this.props.tab, changeHandler: this.SHAChangeHandler})
		}

		// 'Advanced' options
		var options = null;
		if(this.showOptions()) {
			options = React.createElement(AdvancedOptions, {tab: this.props.tab, changeHandler: this.OptionChangeHandler})
		}

		// 'The verify button'
		var verifyButton = null;
		if(this.showVerifyButton()) {
			verifyButton = React.createElement(VerifyButton, {disabled: !this.shaChosen(), changeHandler: this.changeHandler})
		}

		return (
			React.createElement("div", {id: "deploy-tab-"+this.props.tab.id, className: classes}, 
				React.createElement("div", {className: "section"}, 
					React.createElement("div", {htmlFor: this.props.tab.field_id, className: "header"}, 
						React.createElement("span", {className: "numberCircle"}, "1"), " ", this.props.tab.field_label
					), 
					selector, 
					options, 
					verifyButton
				), 
				React.createElement(DeployPlan, {context: this.props.context, summary: this.state.summary})
			)
		);
	}
});

var SelectorDropdown = React.createClass({displayName: "SelectorDropdown",
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
			React.createElement("div", null, 
				React.createElement("div", {className: "field"}, 
					React.createElement("select", {
						ref: "sha", 
						id: this.props.tab.field_id, 
						name: "sha", 
						className: "dropdown", 
						onChange: this.props.changeHandler, 
						style: style}, 
						React.createElement("option", {value: ""}, "Select ", this.props.tab.field_id)
					)
				)
			)
		);
	}
});

var SelectorText = React.createClass({displayName: "SelectorText",
	render: function() {
		return(
			React.createElement("div", {className: "field"}, 
				React.createElement("input", {
					type: "text", 
					ref: "sha", 
					id: this.props.tab.field_id, 
					name: "sha", 
					className: "text", 
					onChange: this.props.changeHandler}
				)
			)
		);
	}
});

var VerifyButton = React.createClass({displayName: "VerifyButton",
	render: function() {
		return (
			React.createElement("div", {className: ""}, 
				React.createElement("button", {
					disabled: this.props.disabled, 
					value: "Verify deployment", 
					className: "btn btn-default", 
					onClick: this.props.changeHandler}, 
					"Verify deployment"
				)
			)
		);
	}
});

var AdvancedOptions = React.createClass({displayName: "AdvancedOptions",
	render: function () {
		return (
			React.createElement("div", {className: "deploy-options"}, 
				React.createElement("div", {className: "fieldcheckbox"}, 
					React.createElement("label", null, 
						React.createElement("input", {
							type: "checkbox", 
							name: "force_full", 
							onChange: this.props.changeHandler}
						), 
						"Force full deployment"
					)
				)
			)
		);
	}
});

module.exports = DeploymentDialog;

},{"./deploy_plan.jsx":4,"./events.js":6,"./helpers.js":7}],6:[function(require,module,exports){
/**
 * A simple pub sub event handler for intercomponent communication
 */
var topics = {};
var hOP = topics.hasOwnProperty;

module.exports = {
	subscribe: function(topic, listener) {
		// Create the topic's object if not yet created
		if(!hOP.call(topics, topic)) topics[topic] = [];

		// Add the listener to queue
		var index = topics[topic].push(listener) -1;

		// Provide handle back for removal of topic
		return {
			remove: function() {
				delete topics[topic][index];
			}
		};
	},

	publish: function(topic, info) {
		// If the topic doesn't exist, or there's no listeners in queue, just leave
		if(!hOP.call(topics, topic)) return;

		// Cycle through topics queue, fire!
		topics[topic].forEach(function(item) {
			item(info != undefined ? info : {});
		});
	}
};

},{}],7:[function(require,module,exports){
/**
 * Helper class to concatinate strings depeding on a true or false.
 *
 * Example:
 * var classes = Helpers.classNames({
 *     "deploy-dropdown": true,
 *     "loading": false,
 *     "open": true,
 * });
 *
 * then classes will equal "deploy-dropdown open"
 *
 * @returns {string}
 */
module.exports = {
	classNames: function () {
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
}

},{}],8:[function(require,module,exports){

/**
 * @jsx React.DOM
 */
var SummaryTable = React.createClass({displayName: "SummaryTable",
	isEmpty: function(obj) {
		for (var key in obj) {
			if (obj.hasOwnProperty(key) && obj[key]) {
				return false;
			}
		}
		return true;
	},
	render: function() {
		var changes = this.props.changes;
		if(this.isEmpty(changes)) {
			return null;
		}
		var idx = 0;
		var summaryLines = Object.keys(changes).map(function(key) {
			idx++;

			var compareUrl = null;
			if(typeof changes[key].compareUrl != 'undefined') {
				compareUrl = changes[key].compareUrl;
			}

			if(typeof changes[key].description!=='undefined') {

				if (changes[key].description!=="") {
					return React.createElement(DescriptionOnlySummaryLine, {key: idx, name: key, description: changes[key].description})
				} else {
					return React.createElement(UnchangedSummaryLine, {key: idx, name: key, value: ""})
				}

			} else if(changes[key].from != changes[key].to) {
				return React.createElement(SummaryLine, {key: idx, name: key, from: changes[key].from, to: changes[key].to, compareUrl: compareUrl})
			} else {
				return React.createElement(UnchangedSummaryLine, {key: idx, name: key, value: changes[key].from})
			}
		});

		return (
			React.createElement("table", {className: "table table-striped table-hover"}, 
				React.createElement("tbody", null, 
					summaryLines
				)
			)
		);
	}
});

var SummaryLine = React.createClass({displayName: "SummaryLine",
	render: function() {
		var from = this.props.from,
			to = this.props.to;

		// naive git sha detection
		if(from !== null && from.length === 40) {
			from = from.substring(0,7);
		}

		// naive git sha detection
		if(to !== null && to.length === 40) {
			to = to.substring(0,7);
		}

		var compareUrl = null;
		if(this.props.compareUrl !== null) {
			compareUrl = React.createElement("a", {target: "_blank", href: this.props.compareUrl}, "View diff")
		}

		return (
			React.createElement("tr", null, 
				React.createElement("th", {scope: "row"}, this.props.name), 
				React.createElement("td", null, from), 
				React.createElement("td", null, React.createElement("span", {className: "glyphicon glyphicon-arrow-right"})), 
				React.createElement("td", null, to), 
				React.createElement("td", {className: "changeAction"}, compareUrl)
			)
		)
	}
});

var UnchangedSummaryLine = React.createClass({displayName: "UnchangedSummaryLine",
	render: function() {
		var from = this.props.value;
		// naive git sha detection
		if(from !== null && from.length === 40) {
			from = from.substring(0,7);
		}

		return (
			React.createElement("tr", null, 
				React.createElement("th", {scope: "row"}, this.props.name), 
				React.createElement("td", null, from), 
				React.createElement("td", null, " "), 
				React.createElement("td", null, React.createElement("span", {className: "label label-success"}, "Unchanged")), 
				React.createElement("td", null, " ")
			)
		);
	}
});

var DescriptionOnlySummaryLine = React.createClass({displayName: "DescriptionOnlySummaryLine",
	render: function() {
		return (
			React.createElement("tr", null, 
				React.createElement("th", {scope: "row"}, this.props.name), 
				React.createElement("td", {colSpan: "4", dangerouslySetInnerHTML: {__html: this.props.description}})
			)
		);
	}
});

module.exports = SummaryTable;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvdmFncmFudC9yZWxlYXNlcy9kZXBsb3ktc2lsdmVyc3RyaXBlLWNvbS9kZXBsb3luYXV0L2pzL2Jhc2UuanN4IiwiL3ZhZ3JhbnQvcmVsZWFzZXMvZGVwbG95LXNpbHZlcnN0cmlwZS1jb20vZGVwbG95bmF1dC9qcy9jcmVhdGVfcHJvamVjdF9wcm9ncmVzcy5qc3giLCIvdmFncmFudC9yZWxlYXNlcy9kZXBsb3ktc2lsdmVyc3RyaXBlLWNvbS9kZXBsb3luYXV0L2pzL2RlcGxveV9rZXlfdGVzdC5qc3giLCIvdmFncmFudC9yZWxlYXNlcy9kZXBsb3ktc2lsdmVyc3RyaXBlLWNvbS9kZXBsb3luYXV0L2pzL2RlcGxveV9wbGFuLmpzeCIsIi92YWdyYW50L3JlbGVhc2VzL2RlcGxveS1zaWx2ZXJzdHJpcGUtY29tL2RlcGxveW5hdXQvanMvZGVwbG95bWVudF9kaWFsb2cuanN4IiwiL3ZhZ3JhbnQvcmVsZWFzZXMvZGVwbG95LXNpbHZlcnN0cmlwZS1jb20vZGVwbG95bmF1dC9qcy9ldmVudHMuanMiLCIvdmFncmFudC9yZWxlYXNlcy9kZXBsb3ktc2lsdmVyc3RyaXBlLWNvbS9kZXBsb3luYXV0L2pzL2hlbHBlcnMuanMiLCIvdmFncmFudC9yZWxlYXNlcy9kZXBsb3ktc2lsdmVyc3RyaXBlLWNvbS9kZXBsb3luYXV0L2pzL3N1bW1hcnlfdGFibGUuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsSUFBSSxnQkFBZ0IsR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQztBQUMxRCxJQUFJLHFCQUFxQixHQUFHLE9BQU8sQ0FBQywrQkFBK0IsQ0FBQyxDQUFDOztBQUVyRSw2RUFBNkU7QUFDN0UsSUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0FBQ2pFLElBQUksTUFB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QSxDQUFBLENBQUMsU0FBQSxFQUFTLENBQUMscUJBQXNCLENBQUEsRUFBQSxXQUFnQixDQUFLLENBQUEsRUFBQTtJQUMvRCxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBLEdBQVcsQ0FBQTtHQUNYLENBQUE7SUFDSjtFQUNGO0FBQ0YsQ0FBQyxDQUFDLENBQUM7O0FBRUgsSUFBSSxnREFBZ0QsMENBQUE7Q0FDbkQsTUFBTSxFQUFFLFdBQVc7RUFDbEI7R0FDQyxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFBO0lBQ0gsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxLQUFBLEVBQUssQ0FBQyxLQUFNLENBQUEsRUFBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQVUsQ0FBQSxFQUFBO0lBQ3RDLG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsT0FBQSxFQUFPLENBQUMsR0FBQSxFQUFHLENBQUMsdUJBQUEsRUFBdUIsQ0FBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBRSxDQUFBLENBQUcsQ0FBQTtHQUN6RSxDQUFBO0lBQ0o7RUFDRjtBQUNGLENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBEZXBsb3ltZW50RGlhbG9nID0gcmVxdWlyZSgnLi9kZXBsb3ltZW50X2RpYWxvZy5qc3gnKTtcbnZhciBDcmVhdGVQcm9qZWN0UHJvZ3Jlc3MgPSByZXF1aXJlKCcuL2NyZWF0ZV9wcm9qZWN0X3Byb2dyZXNzLmpzeCcpO1xuXG4vLyBNb3VudCB0aGUgY29tcG9uZW50IG9ubHkgb24gdGhlIHBhZ2Ugd2hlcmUgdGhlIGhvbGRlciBpcyBhY3R1YWxseSBwcmVzZW50LlxudmFyIGhvbGRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZXBsb3ltZW50LWRpYWxvZy1ob2xkZXInKTtcbmlmIChob2xkZXIpIHtcblx0UmVhY3QucmVuZGVyKFxuXHRcdDxEZXBsb3ltZW50RGlhbG9nIGNvbnRleHQgPSB7ZW52aXJvbm1lbnRDb25maWdDb250ZXh0fSAvPixcblx0XHRob2xkZXJcblx0KTtcbn1cblxudmFyIGNyZWF0ZVByb2plY3RQcm9ncmVzc0hvbGRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjcmVhdGUtcHJvamVjdC1wcm9ncmVzcy1ob2xkZXInKTtcbmlmKGNyZWF0ZVByb2plY3RQcm9ncmVzc0hvbGRlcikge1xuXHRSZWFjdC5yZW5kZXIoXG5cdFx0PENyZWF0ZVByb2plY3RQcm9ncmVzcyBzdGF0dXNVcmw9e2NyZWF0ZVByb2plY3RTdGF0dXNVcmx9XG5cdCAgIFx0XHRkZXBsb3lLZXk9e2RlcGxveUtleX1cblx0XHRcdGRlcGxveUtleVRlc3RVcmw9e2RlcGxveUtleVRlc3RVcmx9XG5cdFx0XHRpbml0YWxDYW5BY2Nlc3NSZXBvPXtjYW5BY2Nlc3NSZXBvfVx0Lz4sXG5cdFx0Y3JlYXRlUHJvamVjdFByb2dyZXNzSG9sZGVyXG5cdCk7XG59XG5cblxuIiwidmFyIERlcGxveUtleVRlc3QgPSByZXF1aXJlKCcuL2RlcGxveV9rZXlfdGVzdC5qc3gnKTtcblxudmFyIENyZWF0ZVByb2plY3RQcm9ncmVzcyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuXHRjaGVja0ludGVydmFsOiBmYWxzZSxcblxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRjb21wbGV0ZTogZmFsc2UsXG5cdFx0XHRjaGVja2luZ1N0YXR1czogZmFsc2Vcblx0XHR9O1xuXHR9LFxuXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmNoZWNrSW50ZXJ2YWwgPSB3aW5kb3cuc2V0SW50ZXJ2YWwodGhpcy5oYW5kbGVDaGVja1N0YXR1cywgMTAwMDApO1xuXHR9LFxuXG5cdGhhbmRsZUNoZWNrU3RhdHVzOiBmdW5jdGlvbigpIHtcblx0XHRpZighdGhpcy5zdGF0ZS5jaGVja2luZ1N0YXR1cykge1xuXHRcdFx0dGhpcy5jaGVja1N0YXR1cygpO1xuXHRcdH1cblx0fSxcblxuXHRjaGVja1N0YXR1czogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdCQuYWpheCh7XG5cdFx0XHR1cmw6IHRoaXMucHJvcHMuc3RhdHVzVXJsLFxuXHRcdFx0ZGF0YVR5cGU6ICdqc29uJyxcblx0XHRcdGNhY2hlOiBmYWxzZSxcblx0XHRcdHR5cGU6ICdHRVQnLFxuXHRcdFx0c3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XHRpZihkYXRhLmNvbXBsZXRlKSB7XG5cdFx0XHRcdFx0c2VsZi5zZXRTdGF0ZSh7Y29tcGxldGU6IHRydWV9KTtcblx0XHRcdFx0XHR3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLmNoZWNrSW50ZXJ2YWwpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHNlbGYuc2V0U3RhdGUoe2NoZWNraW5nU3RhdHVzOiBmYWxzZX0pO1xuXHRcdFx0fS5iaW5kKHRoaXMpLFxuXHRcdFx0ZXJyb3I6IGZ1bmN0aW9uKHhociwgc3RhdHVzLCBlcnIpIHtcblx0XHRcdFx0c2VsZi5zZXRTdGF0ZSh7Y2hlY2tpbmdTdGF0dXM6IGZhbHNlfSk7XG5cdFx0XHR9LmJpbmQodGhpcylcblx0XHR9KTtcblx0fSxcblxuXHRyZWxvYWQ6IGZ1bmN0aW9uKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0d2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYoIXRoaXMuc3RhdGUuY29tcGxldGUpIHtcblx0XHRcdHZhciBkZXBsb3lLZXkgPSAoXG5cdFx0XHRcdDxEZXBsb3lLZXlUZXN0IGRlcGxveUtleT17dGhpcy5wcm9wcy5kZXBsb3lLZXl9IGluaXRpYWxDYW5BY2Nlc3NSZXBvPXt0aGlzLnByb3BzLmNhbkFjY2Vzc1JlcG99IGRlcGxveUtleVRlc3RVcmw9e3RoaXMucHJvcHMuZGVwbG95S2V5VGVzdFVybH0gLz5cblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0aWYodGhpcy5zdGF0ZS5jb21wbGV0ZSkge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3dcIj5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1jaGVjayB0ZXh0LXN1Y2Nlc3MgZmEtNXhcIj48L2k+XG5cdFx0XHRcdFx0PGgxPldlJ3JlIGRvbmUhPC9oMT5cblx0XHRcdFx0XHQ8cD5Zb3VyIGVudmlyb25tZW50cyBhcmUgc2V0dXAgYW5kIHJlYWR5IHRvIGdvITwvcD5cblx0XHRcdFx0XHQ8cD48YSBocmVmPVwiI1wiIG9uQ2xpY2s9e3RoaXMucmVsb2FkfSBjbGFzc05hbWU9XCJidG4gYnRuLXByaW1hcnlcIj5UYWtlIG1lIHRvIG15IGVudmlyb25tZW50cyE8L2E+PC9wPlxuXHRcdFx0XHRcdHtkZXBsb3lLZXl9XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJyb3dcIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvdyBwcm9ncmVzcy1pY29uXCI+XG5cdFx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1jb2cgZmEtc3BpbiBmYS01eFwiPjwvaT5cblx0XHRcdFx0XHQ8L2Rpdj5cblxuXHRcdFx0XHRcdDxoMT5Zb3VyIGVudmlyb25tZW50cyBhcmUgb24gdGhlaXIgd2F5ITwvaDE+XG5cdFx0XHRcdFx0PHA+V2UncmUgY3VycmVudGx5IGJ1aWxkaW5nIHlvdXIgZW52aXJvbm1lbnRzIHdoaWNoIGNhbiB0YWtlIDE1LTQ1IG1pbnV0ZXMsIGRlcGVuZGluZyBvbiBjdXJyZW50IHRyYWZmaWMuPC9wPlxuXHRcdFx0XHRcdHtkZXBsb3lLZXl9XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0KTtcblx0XHR9XG5cdH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ3JlYXRlUHJvamVjdFByb2dyZXNzO1xuIiwidmFyIERlcGxveUtleVRlc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0bG9hZGluZzogZmFsc2UsXG5cdFx0XHR0ZXN0ZWQ6IGZhbHNlLFxuXHRcdFx0Y2FuQWNjZXNzUmVwbzogdGhpcy5wcm9wcy5pbml0aWFsQ2FuQWNjZXNzUmVwb1xuXHRcdH07XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJhZGQtZGVwbG95LWtleVwiPlxuXHRcdFx0XHQ8aDI+QWRkIHlvdXIgZGVwbG95IGtleS4uLjwvaDI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwicm93XCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJjb2wtbWQtNiBjb2wtbWQtb2Zmc2V0LTNcIj5cblx0XHRcdFx0XHRcdDxwPlRvIGdpdmUgdXMgYWNjZXNzIHRvIHlvdXIgcHJpdmF0ZSByZXBvc2l0b3JpZXMgeW91IHdpbGwgbmVlZCB0byBhZGQgdGhlIGRlcGxveSBrZXkgYmVsb3cuIEhvdyB5b3UgYWRkIHRoaXMgd2lsbCBkaWZmZXIgZGVwZW5kaW5nIG9uIHdoYXQgcGxhdGZvcm0geW91IGhvc3QgeW91ciBHSVQgcmVwb3NpdG9yeSBvbjo8L3A+XG5cdFx0XHRcdFx0XHQ8dWwgY2xhc3NOYW1lPVwibGlzdC1pbmxpbmVcIj5cblx0XHRcdFx0XHRcdFx0PGxpPjxpIGNsYXNzTmFtZT1cImZhIGZhLWdpdGh1YlwiPjwvaT4gPGEgaHJlZj1cImh0dHBzOi8vZGV2ZWxvcGVyLmdpdGh1Yi5jb20vZ3VpZGVzL21hbmFnaW5nLWRlcGxveS1rZXlzLyNkZXBsb3kta2V5c1wiIHRhcmdldD1cIl9ibGFua1wiPkdpdGh1YjwvYT48L2xpPlxuXHRcdFx0XHRcdFx0XHQ8bGk+PGkgY2xhc3NOYW1lPVwiZmEgZmEtYml0YnVja2V0XCI+PC9pPiA8YSBocmVmPVwiaHR0cHM6Ly9jb25mbHVlbmNlLmF0bGFzc2lhbi5jb20vYml0YnVja2V0L3VzZS1kZXBsb3ltZW50LWtleXMtMjk0NDg2MDUxLmh0bWxcIiB0YXJnZXQ9XCJfYmxhbmtcIj5CaXRidWNrZXQ8L2E+PC9saT5cblx0XHRcdFx0XHRcdFx0PGxpPjxpbWcgc3JjPVwiZGVwbG95bmF1dC9pbWcvZ2l0bGFiLnBuZ1wiIGFsdD1cIkdpdGxhYlwiIGNsYXNzTmFtZT1cImdpdGxhYi1pY29uXCIgLz4gPGEgaHJlZj1cImh0dHA6Ly9kb2MuZ2l0bGFiLmNvbS9jZS9zc2gvUkVBRE1FLmh0bWwjZGVwbG95LWtleXNcIiB0YXJnZXQ9XCJfYmxhbmtcIj5HaXRsYWI8L2E+PC9saT5cblx0XHRcdFx0XHRcdDwvdWw+XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImNvbC1tZC04IGNvbC1tZC1vZmZzZXQtMiB0ZXh0LWxlZnRcIiBpZD1cImRlcGxveS1rZXktdGVzdC1ob2xkZXJcIj5cblx0XHRcdFx0XHQ8cHJlIGNsYXNzTmFtZT1cImRlcGxveS1rZXlcIj57dGhpcy5wcm9wcy5kZXBsb3lLZXl9PC9wcmU+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInJvd1wiPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiY29sLW1kLTggY29sLW1kLW9mZnNldC0yXCI+XG5cdFx0XHRcdFx0XHR7dGhpcy5idXR0b24oKX1cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9LFxuXG5cdHRlc3RBY2Nlc3M6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoeyBsb2FkaW5nOiB0cnVlIH0pO1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHQkLmFqYXgoe1xuXHRcdFx0dXJsOiB0aGlzLnByb3BzLmRlcGxveUtleVRlc3RVcmwsXG5cdFx0XHRkYXRhVHlwZTogJ2pzb24nLFxuXHRcdFx0Y2FjaGU6IGZhbHNlLFxuXHRcdFx0dHlwZTogJ0dFVCcsXG5cdFx0XHRzdWNjZXNzOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKGRhdGEuY2FuQWNjZXNzUmVwbyk7XG5cdFx0XHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0XHRcdGxvYWRpbmc6IGZhbHNlLFxuXHRcdFx0XHRcdHRlc3RlZDogdHJ1ZSxcblx0XHRcdFx0XHRjYW5BY2Nlc3NSZXBvOiBkYXRhLmNhbkFjY2Vzc1JlcG9cblx0XHRcdFx0fSk7XG5cdFx0XHR9LmJpbmQodGhpcyksXG5cdFx0XHRlcnJvcjogZnVuY3Rpb24oeGhyLCBzdGF0dXMsIGVycikge1xuXHRcdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0XHRsb2FkaW5nOiBmYWxzZSxcblx0XHRcdFx0XHR0ZXN0ZWQ6IHRydWUsXG5cdFx0XHRcdFx0Y2FuQWNjZXNSZXBvOiBmYWxzZVxuXHRcdFx0XHR9KTtcblx0XHRcdH0uYmluZCh0aGlzKVxuXHRcdH0pO1xuXHR9LFxuXG5cdGhhbmRsZVRlc3RBY2Nlc3M6IGZ1bmN0aW9uKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0dGhpcy50ZXN0QWNjZXNzKCk7XG5cdH0sXG5cblx0YnV0dG9uOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgYnV0dG9uVGV4dCA9IHsgX19odG1sOiAnVGVzdCBBY2Nlc3MnIH07XG5cdFx0dmFyIGJ1dHRvbkRpc2FibGVkID0gZmFsc2U7XG5cdFx0dmFyIGJ1dHRvbkNsYXNzID0gJ2J0biBidG4tcHJpbWFyeSc7XG5cdFx0aWYodGhpcy5zdGF0ZS5sb2FkaW5nKSB7XG5cdFx0XHRidXR0b25UZXh0ID0geyBfX2h0bWw6ICc8aSBjbGFzcz1cImZhIGZhLWNvZyBmYS1zcGluXCI+PC9pPiBBdHRlbXB0aW5nIHRvIGNsb25lIHJlcG9zaXRvcnkuLi4nIH07XG5cdFx0XHRidXR0b25EaXNhYmxlZCA9IHRydWU7XG5cdFx0fSBlbHNlIGlmKHRoaXMuc3RhdGUuY2FuQWNjZXNzUmVwbykge1xuXHRcdFx0YnV0dG9uVGV4dCA9IHsgX19odG1sOiAnPGkgY2xhc3M9XCJmYSBmYS1jaGVja1wiPjwvaT4gV2UgY2FuIGFjY2VzcyB5b3VyIHJlcG9zaXRvcnknIH07XG5cdFx0XHRidXR0b25EaXNhYmxlZCA9IHRydWU7XG5cdFx0XHRidXR0b25DbGFzcyA9ICdidG4gYnRuLXN1Y2Nlc3MnO1xuXHRcdH1cblx0XHRcblx0XHR2YXIgbXNnO1xuXHRcdGlmKHRoaXMuc3RhdGUudGVzdGVkICYmICF0aGlzLnN0YXRlLmNhbkFjY2Vzc1JlcG8gJiYgIXRoaXMuc3RhdGUubG9hZGluZykge1xuXHRcdFx0bXNnID0gKFxuXHRcdFx0XHQ8cCBjbGFzc05hbWU9J2FsZXJ0IGFsZXJ0LWRhbmdlcic+XG5cdFx0XHRcdFx0V2UncmUgaGF2aW5nIHRyb3VibGUgYWNjZXNzaW5nIHlvdXIgcmVwb3NpdG9yeS5cblx0XHRcdFx0PC9wPlxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHQgdmFyIGJ1dHRvbiA9IChcblx0XHRcdDxidXR0b24gaHJlZj1cIiNcIiBjbGFzc05hbWU9e2J1dHRvbkNsYXNzfSBvbkNsaWNrPXt0aGlzLmhhbmRsZVRlc3RBY2Nlc3N9IGRpc2FibGVkPXtidXR0b25EaXNhYmxlZH0gZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e2J1dHRvblRleHR9PjwvYnV0dG9uPlxuXHRcdCk7XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdj5cblx0XHRcdFx0e21zZ31cblx0XHRcdFx0e2J1dHRvbn1cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cblx0fVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEZXBsb3lLZXlUZXN0O1xuIiwidmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XG52YXIgSGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycy5qcycpO1xudmFyIFN1bW1hcnlUYWJsZSA9IHJlcXVpcmUoJy4vc3VtbWFyeV90YWJsZS5qc3gnKTtcblxudmFyIERlcGxveVBsYW4gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGxvYWRpbmdTdWI6IG51bGwsXG5cdGxvYWRpbmdEb25lU3ViOiBudWxsLFxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRsb2FkaW5nX2NoYW5nZXM6IGZhbHNlLFxuXHRcdFx0ZGVwbG95X2Rpc2FibGVkOiBmYWxzZSxcblx0XHRcdGRlcGxveUhvdmVyOiBmYWxzZVxuXHRcdH1cblx0fSxcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHQvLyByZWdpc3RlciBzdWJzY3JpYmVyc1xuXHRcdHRoaXMubG9hZGluZ1N1YiA9IEV2ZW50cy5zdWJzY3JpYmUoJ2NoYW5nZV9sb2FkaW5nJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdGxvYWRpbmdfY2hhbmdlczogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdFx0dGhpcy5sb2FkaW5nRG9uZVN1YiA9IEV2ZW50cy5zdWJzY3JpYmUoJ2NoYW5nZV9sb2FkaW5nL2RvbmUnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0bG9hZGluZ19jaGFuZ2VzOiBmYWxzZVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0sXG5cdGRlcGxveUhhbmRsZXI6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGRlcGxveV9kaXNhYmxlZDogdHJ1ZVxuXHRcdH0pO1xuXG5cdFx0USgkLmFqYXgoe1xuXHRcdFx0dHlwZTogXCJQT1NUXCIsXG5cdFx0XHRkYXRhVHlwZTogJ2pzb24nLFxuXHRcdFx0dXJsOiB0aGlzLnByb3BzLmNvbnRleHQuZW52VXJsICsgJy9zdGFydC1kZXBsb3knLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHQvLyBQYXNzIHRoZSBzdHJhdGVneSBvYmplY3QgdGhlIHVzZXIgaGFzIGp1c3Qgc2lnbmVkIG9mZiBiYWNrIHRvIHRoZSBiYWNrZW5kLlxuXHRcdFx0XHQnc3RyYXRlZ3knOiB0aGlzLnByb3BzLnN1bW1hcnksXG5cdFx0XHRcdCdTZWN1cml0eUlEJzogdGhpcy5wcm9wcy5zdW1tYXJ5LlNlY3VyaXR5SURcblx0XHRcdH1cblx0XHR9KSkudGhlbihmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHR3aW5kb3cubG9jYXRpb24gPSBkYXRhLnVybDtcblx0XHR9LCBmdW5jdGlvbihkYXRhKXtcblx0XHRcdGNvbnNvbGUuZXJyb3IoZGF0YSk7XG5cdFx0fSk7XG5cdH0sXG5cdG1vdXNlRW50ZXJIYW5kbGVyOiBmdW5jdGlvbihldmVudCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe2RlcGxveUhvdmVyOiB0cnVlfSk7XG5cdH0sXG5cdG1vdXNlTGVhdmVIYW5kbGVyOiBmdW5jdGlvbihldmVudCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe2RlcGxveUhvdmVyOiBmYWxzZX0pO1xuXHR9LFxuXHRjYW5EZXBsb3k6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAodGhpcy5wcm9wcy5zdW1tYXJ5LnZhbGlkYXRpb25Db2RlPT09XCJzdWNjZXNzXCIgfHwgdGhpcy5wcm9wcy5zdW1tYXJ5LnZhbGlkYXRpb25Db2RlPT09XCJ3YXJuaW5nXCIpO1xuXHR9LFxuXHRpc0VtcHR5OiBmdW5jdGlvbihvYmopIHtcblx0XHRmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG5cdFx0XHRpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkgJiYgb2JqW2tleV0pIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblx0c2hvd05vQ2hhbmdlc01lc3NhZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzdW1tYXJ5ID0gdGhpcy5wcm9wcy5zdW1tYXJ5O1xuXHRcdGlmKHN1bW1hcnkuaW5pdGlhbFN0YXRlID09PSB0cnVlKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdGlmKHN1bW1hcnkubWVzc2FnZXMgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdFx0cmV0dXJuICh0aGlzLmlzRW1wdHkoc3VtbWFyeS5jaGFuZ2VzKSAmJiBzdW1tYXJ5Lm1lc3NhZ2VzLmxlbmd0aCA9PT0gMCk7XG5cdH0sXG5cdGFjdGlvblRpdGxlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgYWN0aW9uVGl0bGUgPSB0aGlzLnByb3BzLnN1bW1hcnkuYWN0aW9uVGl0bGU7XG5cdFx0aWYgKHR5cGVvZiBhY3Rpb25UaXRsZSA9PT0gJ3VuZGVmaW5lZCcgfHwgYWN0aW9uVGl0bGUgPT09ICcnICkge1xuXHRcdFx0cmV0dXJuICdNYWtlIGEgc2VsZWN0aW9uJztcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMucHJvcHMuc3VtbWFyeS5hY3Rpb25UaXRsZTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbWVzc2FnZXMgPSB0aGlzLnByb3BzLnN1bW1hcnkubWVzc2FnZXM7XG5cdFx0aWYgKHRoaXMuc2hvd05vQ2hhbmdlc01lc3NhZ2UoKSkge1xuXHRcdFx0bWVzc2FnZXMgPSBbe1xuXHRcdFx0XHR0ZXh0OiBcIlRoZXJlIGFyZSBubyBjaGFuZ2VzIGJ1dCB5b3UgY2FuIGRlcGxveSBhbnl3YXkgaWYgeW91IHdpc2guXCIsXG5cdFx0XHRcdGNvZGU6IFwic3VjY2Vzc1wiXG5cdFx0XHR9XTtcblx0XHR9XG5cblx0XHR2YXIgZGVwbG95QWN0aW9uO1xuXHRcdGlmKHRoaXMuY2FuRGVwbG95KCkpIHtcblx0XHRcdGRlcGxveUFjdGlvbiA9IChcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZWN0aW9uXCJcblx0XHRcdFx0XHRvbk1vdXNlRW50ZXI9e3RoaXMubW91c2VFbnRlckhhbmRsZXJ9XG5cdFx0XHRcdFx0b25Nb3VzZUxlYXZlPXt0aGlzLm1vdXNlTGVhdmVIYW5kbGVyfT5cblx0XHRcdFx0XHRcdDxidXR0b25cblx0XHRcdFx0XHRcdFx0dmFsdWU9XCJDb25maXJtIERlcGxveW1lbnRcIlxuXHRcdFx0XHRcdFx0XHRjbGFzc05hbWU9XCJkZXBsb3kgcHVsbC1sZWZ0XCJcblx0XHRcdFx0XHRcdFx0ZGlzYWJsZWQ9e3RoaXMuc3RhdGUuZGVwbG95X2Rpc2FibGVkfVxuXHRcdFx0XHRcdFx0XHRvbkNsaWNrPXt0aGlzLmRlcGxveUhhbmRsZXJ9PlxuXHRcdFx0XHRcdFx0XHR7dGhpcy5hY3Rpb25UaXRsZSgpfVxuXHRcdFx0XHRcdFx0PC9idXR0b24+XG5cdFx0XHRcdFx0XHQ8UXVpY2tTdW1tYXJ5IGFjdGl2YXRlZD17dGhpcy5zdGF0ZS5kZXBsb3lIb3Zlcn0gY29udGV4dD17dGhpcy5wcm9wcy5jb250ZXh0fSBzdW1tYXJ5PXt0aGlzLnByb3BzLnN1bW1hcnl9IC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHR2YXIgaGVhZGVyQ2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG5cdFx0XHRoZWFkZXI6IHRydWUsXG5cdFx0XHRpbmFjdGl2ZTogIXRoaXMuY2FuRGVwbG95KCksXG5cdFx0XHRsb2FkaW5nOiB0aGlzLnN0YXRlLmxvYWRpbmdfY2hhbmdlc1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuKFxuXHRcdFx0PGRpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZWN0aW9uXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9e2hlYWRlckNsYXNzZXN9PlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwic3RhdHVzLWljb25cIj48L3NwYW4+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJudW1iZXJDaXJjbGVcIj4yPC9zcGFuPiBSZXZpZXcgY2hhbmdlc1xuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdDxNZXNzYWdlTGlzdCBtZXNzYWdlcz17bWVzc2FnZXN9IC8+XG5cdFx0XHRcdFx0PFN1bW1hcnlUYWJsZSBjaGFuZ2VzPXt0aGlzLnByb3BzLnN1bW1hcnkuY2hhbmdlc30gLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdHtkZXBsb3lBY3Rpb259XG5cdFx0XHQ8L2Rpdj5cblx0XHQpXG5cdH1cbn0pO1xuXG52YXIgUXVpY2tTdW1tYXJ5ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0eXBlID0gKHRoaXMucHJvcHMuc3VtbWFyeS5hY3Rpb25Db2RlPT09J2Zhc3QnID8gJ2NvZGUtb25seScgOiAnZnVsbCcpO1xuXHRcdHZhciBlc3RpbWF0ZSA9IFtdO1xuXHRcdGlmICh0aGlzLnByb3BzLnN1bW1hcnkuZXN0aW1hdGVkVGltZSAmJiB0aGlzLnByb3BzLnN1bW1hcnkuZXN0aW1hdGVkVGltZT4wKSB7XG5cdFx0XHRlc3RpbWF0ZSA9IFtcblx0XHRcdFx0PGR0PkR1cmF0aW9uOjwvZHQ+LFxuXHRcdFx0XHQ8ZGQ+e3RoaXMucHJvcHMuc3VtbWFyeS5lc3RpbWF0ZWRUaW1lfSBtaW4gYXBwcm94LjwvZGQ+XG5cdFx0XHRdO1xuXHRcdH1cblxuXHRcdHZhciBkbENsYXNzZXMgPSBIZWxwZXJzLmNsYXNzTmFtZXMoe1xuXHRcdFx0YWN0aXZhdGVkOiB0aGlzLnByb3BzLmFjdGl2YXRlZCxcblx0XHRcdCdxdWljay1zdW1tYXJ5JzogdHJ1ZVxuXHRcdH0pO1xuXG5cdFx0dmFyIG1vcmVJbmZvID0gbnVsbDtcblx0XHRpZiAodHlwZW9mIHRoaXMucHJvcHMuY29udGV4dC5kZXBsb3lIZWxwIT09J3VuZGVmaW5lZCcgJiYgdGhpcy5wcm9wcy5jb250ZXh0LmRlcGxveUhlbHApIHtcblx0XHRcdG1vcmVJbmZvID0gKFxuXHRcdFx0XHQ8YSB0YXJnZXQ9XCJfYmxhbmtcIiBjbGFzc05hbWU9XCJzbWFsbFwiIGhyZWY9e3RoaXMucHJvcHMuY29udGV4dC5kZXBsb3lIZWxwfT5tb3JlIGluZm88L2E+XG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnByb3BzLmNvbnRleHQuc2l0ZVVybCkge1xuXHRcdFx0dmFyIGVudiA9IDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9e3RoaXMucHJvcHMuY29udGV4dC5zaXRlVXJsfT57dGhpcy5wcm9wcy5jb250ZXh0LmVudk5hbWV9PC9hPjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIGVudiA9IDxzcGFuPnt0aGlzLnByb3BzLmNvbnRleHQuZW52TmFtZX08L3NwYW4+O1xuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGwgY2xhc3NOYW1lPXtkbENsYXNzZXN9PlxuXHRcdFx0XHQ8ZHQ+RW52aXJvbm1lbnQ6PC9kdD5cblx0XHRcdFx0PGRkPntlbnZ9PC9kZD5cblx0XHRcdFx0PGR0PkRlcGxveSB0eXBlOjwvZHQ+XG5cdFx0XHRcdDxkZD57dHlwZX0ge21vcmVJbmZvfTwvZGQ+XG5cdFx0XHRcdHtlc3RpbWF0ZX1cblx0XHRcdDwvZGw+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBNZXNzYWdlTGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRpZih0aGlzLnByb3BzLm1lc3NhZ2VzLmxlbmd0aCA8IDEpIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblx0XHRpZih0eXBlb2YgdGhpcy5wcm9wcy5tZXNzYWdlcyA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblx0XHR2YXIgaWR4ID0gMDtcblx0XHR2YXIgbWVzc2FnZXMgPSB0aGlzLnByb3BzLm1lc3NhZ2VzLm1hcChmdW5jdGlvbihtZXNzYWdlKSB7XG5cdFx0XHRpZHgrKztcblx0XHRcdHJldHVybiA8TWVzc2FnZSBrZXk9e2lkeH0gbWVzc2FnZT17bWVzc2FnZX0gLz5cblx0XHR9KTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdj5cblx0XHRcdFx0e21lc3NhZ2VzfVxuXHRcdFx0PC9kaXY+XG5cdFx0KVxuXHR9XG59KTtcblxudmFyIE1lc3NhZ2UgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNsYXNzTWFwID0ge1xuXHRcdFx0J2Vycm9yJzogJ2FsZXJ0IGFsZXJ0LWRhbmdlcicsXG5cdFx0XHQnd2FybmluZyc6ICdhbGVydCBhbGVydC13YXJuaW5nJyxcblx0XHRcdCdzdWNjZXNzJzogJ2FsZXJ0IGFsZXJ0LWluZm8nXG5cdFx0fTtcblx0XHR2YXIgY2xhc3NuYW1lPWNsYXNzTWFwW3RoaXMucHJvcHMubWVzc2FnZS5jb2RlXTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9e2NsYXNzbmFtZX0gcm9sZT1cImFsZXJ0XCJcblx0XHRcdFx0ZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3tfX2h0bWw6IHRoaXMucHJvcHMubWVzc2FnZS50ZXh0fX0gLz5cblx0XHQpXG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERlcGxveVBsYW47XG4iLCJ2YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcbnZhciBIZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzLmpzJyk7XG52YXIgRGVwbG95UGxhbiA9IHJlcXVpcmUoJy4vZGVwbG95X3BsYW4uanN4Jyk7XG5cbnZhciBEZXBsb3ltZW50RGlhbG9nID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdGxvYWRpbmdTdWI6IG51bGwsXG5cblx0bG9hZGluZ0RvbmVTdWI6IG51bGwsXG5cblx0ZXJyb3JTdWI6IG51bGwsXG5cblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0bG9hZGluZzogZmFsc2UsXG5cdFx0XHRsb2FkaW5nVGV4dDogXCJcIixcblx0XHRcdGVycm9yVGV4dDogXCJcIixcblx0XHRcdGZldGNoZWQ6IHRydWUsXG5cdFx0XHRsYXN0X2ZldGNoZWQ6IFwiXCJcblx0XHR9O1xuXHR9LFxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdC8vIGFkZCBzdWJzY3JpYmVyc1xuXHRcdHRoaXMubG9hZGluZ1N1YiA9IEV2ZW50cy5zdWJzY3JpYmUoJ2xvYWRpbmcnLCBmdW5jdGlvbih0ZXh0KSB7XG5cdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0bG9hZGluZzogdHJ1ZSxcblx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdGxvYWRpbmdUZXh0OiB0ZXh0XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0XHR0aGlzLmxvYWRpbmdEb25lU3ViID0gRXZlbnRzLnN1YnNjcmliZSgnbG9hZGluZy9kb25lJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0bG9hZGluZzogZmFsc2UsXG5cdFx0XHRcdGxvYWRpbmdUZXh0OiAnJyxcblx0XHRcdFx0c3VjY2VzczogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdFx0dGhpcy5lcnJvclN1YiA9IEV2ZW50cy5zdWJzY3JpYmUoJ2Vycm9yJywgZnVuY3Rpb24odGV4dCkge1xuXHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdGVycm9yVGV4dDogdGV4dCxcblx0XHRcdFx0bG9hZGluZzogZmFsc2UsXG5cdFx0XHRcdGxvYWRpbmdUZXh0OiAnJyxcblx0XHRcdFx0c3VjY2VzczogZmFsc2Vcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9LFxuXHRjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gcmVtb3ZlIHN1YnNjcmliZXJzXG5cdFx0dGhpcy5sb2FkaW5nU3ViLnJlbW92ZSgpO1xuXHRcdHRoaXMubG9hZGluZ0RvbmVTdWIucmVtb3ZlKCk7XG5cdFx0dGhpcy5lcnJvclN1Yi5yZW1vdmUoKTtcblx0fSxcblx0aGFuZGxlQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0RXZlbnRzLnB1Ymxpc2goJ2xvYWRpbmcnLCBcIkZldGNoaW5nIGxhdGVzdCBjb2Rl4oCmXCIpO1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0ZmV0Y2hlZDogZmFsc2Vcblx0XHR9KTtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0USgkLmFqYXgoe1xuXHRcdFx0dHlwZTogXCJQT1NUXCIsXG5cdFx0XHRkYXRhVHlwZTogJ2pzb24nLFxuXHRcdFx0dXJsOiB0aGlzLnByb3BzLmNvbnRleHQucHJvamVjdFVybCArICcvZmV0Y2gnXG5cdFx0fSkpXG5cdFx0XHQudGhlbih0aGlzLndhaXRGb3JGZXRjaFRvQ29tcGxldGUsIHRoaXMuZmV0Y2hTdGF0dXNFcnJvcilcblx0XHRcdC50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRFdmVudHMucHVibGlzaCgnbG9hZGluZy9kb25lJyk7XG5cdFx0XHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0XHRcdGZldGNoZWQ6IHRydWVcblx0XHRcdFx0fSlcblx0XHRcdH0pLmNhdGNoKHRoaXMuZmV0Y2hTdGF0dXNFcnJvcikuZG9uZSgpO1xuXHR9LFxuXHR3YWl0Rm9yRmV0Y2hUb0NvbXBsZXRlOmZ1bmN0aW9uIChmZXRjaERhdGEpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0RmV0Y2hTdGF0dXMoZmV0Y2hEYXRhKS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0XHRpZiAoZGF0YS5zdGF0dXMgPT09IFwiQ29tcGxldGVcIikge1xuXHRcdFx0XHRyZXR1cm4gZGF0YTtcblx0XHRcdH1cblx0XHRcdGlmIChkYXRhLnN0YXR1cyA9PT0gXCJGYWlsZWRcIikge1xuXHRcdFx0XHRyZXR1cm4gJC5EZWZlcnJlZChmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRcdHJldHVybiBkLnJlamVjdChkYXRhKTtcblx0XHRcdFx0fSkucHJvbWlzZSgpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHNlbGYud2FpdEZvckZldGNoVG9Db21wbGV0ZShmZXRjaERhdGEpO1xuXHRcdH0pO1xuXHR9LFxuXHRnZXRGZXRjaFN0YXR1czogZnVuY3Rpb24gKGZldGNoRGF0YSkge1xuXHRcdHJldHVybiBRKCQuYWpheCh7XG5cdFx0XHR0eXBlOiBcIkdFVFwiLFxuXHRcdFx0dXJsOiBmZXRjaERhdGEuaHJlZixcblx0XHRcdGRhdGFUeXBlOiAnanNvbidcblx0XHR9KSk7XG5cdH0sXG5cdGZldGNoU3RhdHVzRXJyb3I6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHR2YXIgbWVzc2FnZSAgPSAnVW5rbm93biBlcnJvcic7XG5cdFx0aWYodHlwZW9mIGRhdGEucmVzcG9uc2VUZXh0ICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0bWVzc2FnZSA9IGRhdGEucmVzcG9uc2VUZXh0O1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIGRhdGEubWVzc2FnZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdG1lc3NhZ2UgPSBkYXRhLm1lc3NhZ2U7XG5cdFx0fVxuXHRcdEV2ZW50cy5wdWJsaXNoKCdlcnJvcicsIG1lc3NhZ2UpO1xuXHR9LFxuXHRsYXN0RmV0Y2hlZEhhbmRsZXI6IGZ1bmN0aW9uKHRpbWVfYWdvKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7bGFzdF9mZXRjaGVkOiB0aW1lX2Fnb30pO1xuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjbGFzc2VzID0gSGVscGVycy5jbGFzc05hbWVzKHtcblx0XHRcdFwiZGVwbG95LWRyb3Bkb3duXCI6IHRydWUsXG5cdFx0XHRcImxvYWRpbmdcIjogdGhpcy5zdGF0ZS5sb2FkaW5nLFxuXHRcdFx0XCJzdWNjZXNzXCI6IHRoaXMuc3RhdGUuc3VjY2Vzc1xuXHRcdH0pO1xuXG5cdFx0dmFyIGZvcm07XG5cblx0XHRpZih0aGlzLnN0YXRlLmVycm9yVGV4dCAhPT0gXCJcIikge1xuXHRcdFx0Zm9ybSA9IDxFcnJvck1lc3NhZ2VzIG1lc3NhZ2U9e3RoaXMuc3RhdGUuZXJyb3JUZXh0fSAvPlxuXHRcdH0gZWxzZSBpZih0aGlzLnN0YXRlLmZldGNoZWQpIHtcblx0XHRcdGZvcm0gPSA8RGVwbG95Rm9ybSBjb250ZXh0PXt0aGlzLnByb3BzLmNvbnRleHR9IGRhdGE9e3RoaXMucHJvcHMuZGF0YX0gbGFzdEZldGNoZWRIYW5kbGVyPXt0aGlzLmxhc3RGZXRjaGVkSGFuZGxlcn0gLz5cblx0XHR9IGVsc2UgaWYgKHRoaXMuc3RhdGUubG9hZGluZykge1xuXHRcdFx0Zm9ybSA9IDxMb2FkaW5nRGVwbG95Rm9ybSBtZXNzYWdlPVwiRmV0Y2hpbmcgbGF0ZXN0IGNvZGUmaGVsbGlwO1wiIC8+XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPXtjbGFzc2VzfSBvbkNsaWNrPXt0aGlzLmhhbmRsZUNsaWNrfT5cblx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJzdGF0dXMtaWNvblwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj5cblx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJ0aW1lXCI+bGFzdCB1cGRhdGVkIHt0aGlzLnN0YXRlLmxhc3RfZmV0Y2hlZH08L3NwYW4+XG5cdFx0XHRcdFx0PEVudmlyb25tZW50TmFtZSBlbnZpcm9ubWVudE5hbWU9e3RoaXMucHJvcHMuY29udGV4dC5lbnZOYW1lfSAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0e2Zvcm19XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIExvYWRpbmdEZXBsb3lGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImRlcGxveS1mb3JtLWxvYWRpbmdcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJpY29uLWhvbGRlclwiPlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT1cImZhIGZhLWNvZyBmYS1zcGluXCI+PC9pPlxuXHRcdFx0XHRcdDxzcGFuPnt0aGlzLnByb3BzLm1lc3NhZ2V9PC9zcGFuPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgRXJyb3JNZXNzYWdlcyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJkZXBsb3ktZHJvcGRvd24tZXJyb3JzXCI+XG5cdFx0XHRcdHt0aGlzLnByb3BzLm1lc3NhZ2V9XG5cdFx0XHQ8L2Rpdj5cblx0XHQpXG5cdH1cbn0pO1xuXG4vKipcbiAqIEVudmlyb25tZW50TmFtZVxuICovXG52YXIgRW52aXJvbm1lbnROYW1lID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiZW52aXJvbm1lbnQtbmFtZVwiPlxuXHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1yb2NrZXRcIj4mbmJzcDs8L2k+XG5cdFx0XHRcdERlcGxveW1lbnQgb3B0aW9ucyA8c3BhbiBjbGFzc05hbWU9XCJoaWRkZW4teHNcIj5mb3Ige3RoaXMucHJvcHMuZW52aXJvbm1lbnROYW1lfTwvc3Bhbj5cblx0XHRcdDwvc3Bhbj5cblx0XHQpO1xuXHR9XG59KTtcblxuLyoqXG4gKiBEZXBsb3lGb3JtXG4gKi9cbnZhciBEZXBsb3lGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzZWxlY3RlZFRhYjogMSxcblx0XHRcdGRhdGE6IFtdXG5cdFx0fTtcblx0fSxcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZ2l0RGF0YSgpO1xuXHR9LFxuXG5cdGdpdERhdGE6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdGxvYWRpbmc6IHRydWVcblx0XHR9KTtcblx0XHRRKCQuYWpheCh7XG5cdFx0XHR0eXBlOiBcIlBPU1RcIixcblx0XHRcdGRhdGFUeXBlOiAnanNvbicsXG5cdFx0XHR1cmw6IHRoaXMucHJvcHMuY29udGV4dC5lbnZVcmwgKyAnL2dpdF9yZXZpc2lvbnMnXG5cdFx0fSkpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdGxvYWRpbmc6IGZhbHNlLFxuXHRcdFx0XHRkYXRhOiBkYXRhLlRhYnNcblx0XHRcdH0pO1xuXHRcdFx0c2VsZi5wcm9wcy5sYXN0RmV0Y2hlZEhhbmRsZXIoZGF0YS5sYXN0X2ZldGNoZWQpO1xuXHRcdH0sIGZ1bmN0aW9uKGRhdGEpe1xuXHRcdFx0RXZlbnRzLnB1Ymxpc2goJ2Vycm9yJywgZGF0YSk7XG5cdFx0fSk7XG5cdH0sXG5cblx0c2VsZWN0SGFuZGxlcjogZnVuY3Rpb24oaWQpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtzZWxlY3RlZFRhYjogaWR9KTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0aWYodGhpcy5zdGF0ZS5sb2FkaW5nKSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQ8TG9hZGluZ0RlcGxveUZvcm0gbWVzc2FnZT1cIkxvYWRpbmcmaGVsbGlwO1wiIC8+XG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImRlcGxveS1mb3JtLW91dGVyIGNsZWFyZml4XCI+XG5cdFx0XHRcdDxmb3JtIGNsYXNzTmFtZT1cImZvcm0taW5saW5lIGRlcGxveS1mb3JtXCIgYWN0aW9uPVwiUE9TVFwiIGFjdGlvbj1cIiNcIj5cblx0XHRcdFx0XHQ8RGVwbG95VGFiU2VsZWN0b3IgZGF0YT17dGhpcy5zdGF0ZS5kYXRhfSBvblNlbGVjdD17dGhpcy5zZWxlY3RIYW5kbGVyfSBzZWxlY3RlZFRhYj17dGhpcy5zdGF0ZS5zZWxlY3RlZFRhYn0gLz5cblx0XHRcdFx0XHQ8RGVwbG95VGFicyBjb250ZXh0PXt0aGlzLnByb3BzLmNvbnRleHR9IGRhdGE9e3RoaXMuc3RhdGUuZGF0YX0gc2VsZWN0ZWRUYWI9e3RoaXMuc3RhdGUuc2VsZWN0ZWRUYWJ9IFNlY3VyaXR5VG9rZW49e3RoaXMuc3RhdGUuU2VjdXJpdHlUb2tlbn0gLz5cblx0XHRcdFx0PC9mb3JtPlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbi8qKlxuICogRGVwbG95VGFiU2VsZWN0b3JcbiAqL1xudmFyIERlcGxveVRhYlNlbGVjdG9yID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIHNlbGVjdG9ycyA9IHRoaXMucHJvcHMuZGF0YS5tYXAoZnVuY3Rpb24odGFiKSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQ8RGVwbG95VGFiU2VsZWN0IGtleT17dGFiLmlkfSB0YWI9e3RhYn0gb25TZWxlY3Q9e3NlbGYucHJvcHMub25TZWxlY3R9IHNlbGVjdGVkVGFiPXtzZWxmLnByb3BzLnNlbGVjdGVkVGFifSAvPlxuXHRcdFx0KTtcblx0XHR9KTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PHVsIGNsYXNzTmFtZT1cIlNlbGVjdGlvbkdyb3VwIHRhYmJlZHNlbGVjdGlvbmdyb3VwIG5vbGFiZWxcIj5cblx0XHRcdFx0e3NlbGVjdG9yc31cblx0XHRcdDwvdWw+XG5cdFx0KTtcblx0fVxufSk7XG5cbi8qKlxuICogRGVwbG95VGFiU2VsZWN0XG4gKi9cbnZhciBEZXBsb3lUYWJTZWxlY3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGhhbmRsZUNsaWNrOiBmdW5jdGlvbihlKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdHRoaXMucHJvcHMub25TZWxlY3QodGhpcy5wcm9wcy50YWIuaWQpXG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBjbGFzc2VzID0gSGVscGVycy5jbGFzc05hbWVzKHtcblx0XHRcdFwiYWN0aXZlXCIgOiAodGhpcy5wcm9wcy5zZWxlY3RlZFRhYiA9PSB0aGlzLnByb3BzLnRhYi5pZClcblx0XHR9KTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGxpIGNsYXNzTmFtZT17Y2xhc3Nlc30+XG5cdFx0XHRcdDxhIG9uQ2xpY2s9e3RoaXMuaGFuZGxlQ2xpY2t9IGhyZWY9e1wiI2RlcGxveS10YWItXCIrdGhpcy5wcm9wcy50YWIuaWR9ID57dGhpcy5wcm9wcy50YWIubmFtZX08L2E+XG5cdFx0XHQ8L2xpPlxuXHRcdCk7XG5cdH1cblxufSk7XG5cbi8qKlxuICogRGVwbG95VGFic1xuICovXG52YXIgRGVwbG95VGFicyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciB0YWJzID0gdGhpcy5wcm9wcy5kYXRhLm1hcChmdW5jdGlvbih0YWIpIHtcblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdDxEZXBsb3lUYWIgY29udGV4dD17c2VsZi5wcm9wcy5jb250ZXh0fSBrZXk9e3RhYi5pZH0gdGFiPXt0YWJ9IHNlbGVjdGVkVGFiPXtzZWxmLnByb3BzLnNlbGVjdGVkVGFifSBTZWN1cml0eVRva2VuPXtzZWxmLnByb3BzLlNlY3VyaXR5VG9rZW59IC8+XG5cdFx0XHQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwidGFiLWNvbnRlbnRcIj5cblx0XHRcdFx0e3RhYnN9XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxuLyoqXG4gKiBEZXBsb3lUYWJcbiAqL1xudmFyIERlcGxveVRhYiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c3VtbWFyeTogdGhpcy5nZXRJbml0aWFsU3VtbWFyeVN0YXRlKCksXG5cdFx0XHRvcHRpb25zOiB7fSxcblx0XHRcdHNoYTogJydcblx0XHR9O1xuXHR9LFxuXHRnZXRJbml0aWFsU3VtbWFyeVN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Y2hhbmdlczoge30sXG5cdFx0XHRtZXNzYWdlczogW10sXG5cdFx0XHR2YWxpZGF0aW9uQ29kZTogJycsXG5cdFx0XHRlc3RpbWF0ZWRUaW1lOiBudWxsLFxuXHRcdFx0YWN0aW9uQ29kZTogbnVsbCxcblx0XHRcdGluaXRpYWxTdGF0ZTogdHJ1ZVxuXHRcdH1cblx0fSxcblx0T3B0aW9uQ2hhbmdlSGFuZGxlcjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMuc3RhdGUub3B0aW9ucztcblx0XHRvcHRpb25zW2V2ZW50LnRhcmdldC5uYW1lXSA9IGV2ZW50LnRhcmdldC5jaGVja2VkO1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0b3B0aW9uczogb3B0aW9uc1xuXHRcdH0pO1xuXHR9LFxuXHRTSEFDaGFuZ2VIYW5kbGVyOiBmdW5jdGlvbihldmVudCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0c2hhOiBldmVudC50YXJnZXQudmFsdWVcblx0XHR9KTtcblx0fSxcblx0Y2hhbmdlSGFuZGxlcjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRzdW1tYXJ5OiB0aGlzLmdldEluaXRpYWxTdW1tYXJ5U3RhdGUoKVxuXHRcdH0pO1xuXG5cdFx0aWYoZXZlbnQudGFyZ2V0LnZhbHVlID09PSBcIlwiKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0RXZlbnRzLnB1Ymxpc2goJ2NoYW5nZV9sb2FkaW5nJyk7XG5cblx0XHR2YXIgc3VtbWFyeURhdGEgPSB7XG5cdFx0XHRzaGE6IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5zaGFfc2VsZWN0b3IucmVmcy5zaGEpLnZhbHVlLFxuXHRcdFx0U2VjdXJpdHlJRDogdGhpcy5wcm9wcy5TZWN1cml0eVRva2VuXG5cdFx0fTtcblx0XHQvLyBtZXJnZSB0aGUgJ2FkdmFuY2VkJyBvcHRpb25zIGlmIHRoZXkgYXJlIHNldFxuXHRcdGZvciAodmFyIGF0dHJuYW1lIGluIHRoaXMuc3RhdGUub3B0aW9ucykge1xuXHRcdFx0aWYodGhpcy5zdGF0ZS5vcHRpb25zLmhhc093blByb3BlcnR5KGF0dHJuYW1lKSkge1xuXHRcdFx0XHRzdW1tYXJ5RGF0YVthdHRybmFtZV0gPSB0aGlzLnN0YXRlLm9wdGlvbnNbYXR0cm5hbWVdO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRRKCQuYWpheCh7XG5cdFx0XHR0eXBlOiBcIlBPU1RcIixcblx0XHRcdGRhdGFUeXBlOiAnanNvbicsXG5cdFx0XHR1cmw6IHRoaXMucHJvcHMuY29udGV4dC5lbnZVcmwgKyAnL2RlcGxveV9zdW1tYXJ5Jyxcblx0XHRcdGRhdGE6IHN1bW1hcnlEYXRhXG5cdFx0fSkpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRcdHN1bW1hcnk6IGRhdGFcblx0XHRcdH0pO1xuXHRcdFx0RXZlbnRzLnB1Ymxpc2goJ2NoYW5nZV9sb2FkaW5nL2RvbmUnKTtcblx0XHR9LmJpbmQodGhpcyksIGZ1bmN0aW9uKCl7XG5cdFx0XHRFdmVudHMucHVibGlzaCgnY2hhbmdlX2xvYWRpbmcvZG9uZScpO1xuXHRcdH0pO1xuXHR9LFxuXG5cdHNob3dPcHRpb25zOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5wcm9wcy50YWIuYWR2YW5jZWRfb3B0cyA9PT0gJ3RydWUnO1xuXHR9LFxuXG5cdHNob3dWZXJpZnlCdXR0b246IGZ1bmN0aW9uKCkge1xuXHRcdGlmKHRoaXMuc2hvd09wdGlvbnMoKSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnByb3BzLnRhYi5maWVsZF90eXBlID09ICd0ZXh0ZmllbGQnO1xuXHR9LFxuXG5cdHNoYUNob3NlbjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICh0aGlzLnN0YXRlLnNoYSAhPT0gJycpO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBjbGFzc2VzID0gSGVscGVycy5jbGFzc05hbWVzKHtcblx0XHRcdFwidGFiLXBhbmVcIjogdHJ1ZSxcblx0XHRcdFwiY2xlYXJmaXhcIjogdHJ1ZSxcblx0XHRcdFwiYWN0aXZlXCIgOiAodGhpcy5wcm9wcy5zZWxlY3RlZFRhYiA9PSB0aGlzLnByb3BzLnRhYi5pZClcblx0XHR9KTtcblxuXHRcdC8vIHNldHVwIHRoZSBkcm9wZG93biBvciB0aGUgdGV4dCBpbnB1dCBmb3Igc2VsZWN0aW5nIGEgU0hBXG5cdFx0dmFyIHNlbGVjdG9yO1xuXHRcdGlmICh0aGlzLnByb3BzLnRhYi5maWVsZF90eXBlID09ICdkcm9wZG93bicpIHtcblx0XHRcdHZhciBjaGFuZ2VIYW5kbGVyID0gdGhpcy5jaGFuZ2VIYW5kbGVyO1xuXHRcdFx0aWYodGhpcy5zaG93VmVyaWZ5QnV0dG9uKCkpIHsgY2hhbmdlSGFuZGxlciA9IHRoaXMuU0hBQ2hhbmdlSGFuZGxlciB9XG5cdFx0XHRzZWxlY3RvciA9IDxTZWxlY3RvckRyb3Bkb3duIHJlZj1cInNoYV9zZWxlY3RvclwiIHRhYj17dGhpcy5wcm9wcy50YWJ9IGNoYW5nZUhhbmRsZXI9e2NoYW5nZUhhbmRsZXJ9IC8+XG5cdFx0fSBlbHNlIGlmICh0aGlzLnByb3BzLnRhYi5maWVsZF90eXBlID09ICd0ZXh0ZmllbGQnKSB7XG5cdFx0XHRzZWxlY3RvciA9IDxTZWxlY3RvclRleHQgcmVmPVwic2hhX3NlbGVjdG9yXCIgdGFiPXt0aGlzLnByb3BzLnRhYn0gY2hhbmdlSGFuZGxlcj17dGhpcy5TSEFDaGFuZ2VIYW5kbGVyfSAvPlxuXHRcdH1cblxuXHRcdC8vICdBZHZhbmNlZCcgb3B0aW9uc1xuXHRcdHZhciBvcHRpb25zID0gbnVsbDtcblx0XHRpZih0aGlzLnNob3dPcHRpb25zKCkpIHtcblx0XHRcdG9wdGlvbnMgPSA8QWR2YW5jZWRPcHRpb25zIHRhYj17dGhpcy5wcm9wcy50YWJ9IGNoYW5nZUhhbmRsZXI9e3RoaXMuT3B0aW9uQ2hhbmdlSGFuZGxlcn0gLz5cblx0XHR9XG5cblx0XHQvLyAnVGhlIHZlcmlmeSBidXR0b24nXG5cdFx0dmFyIHZlcmlmeUJ1dHRvbiA9IG51bGw7XG5cdFx0aWYodGhpcy5zaG93VmVyaWZ5QnV0dG9uKCkpIHtcblx0XHRcdHZlcmlmeUJ1dHRvbiA9IDxWZXJpZnlCdXR0b24gZGlzYWJsZWQ9eyF0aGlzLnNoYUNob3NlbigpfSBjaGFuZ2VIYW5kbGVyPXt0aGlzLmNoYW5nZUhhbmRsZXJ9IC8+XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgaWQ9e1wiZGVwbG95LXRhYi1cIit0aGlzLnByb3BzLnRhYi5pZH0gY2xhc3NOYW1lPXtjbGFzc2VzfT5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZWN0aW9uXCI+XG5cdFx0XHRcdFx0PGRpdiBodG1sRm9yPXt0aGlzLnByb3BzLnRhYi5maWVsZF9pZH0gY2xhc3NOYW1lPVwiaGVhZGVyXCI+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJudW1iZXJDaXJjbGVcIj4xPC9zcGFuPiB7dGhpcy5wcm9wcy50YWIuZmllbGRfbGFiZWx9XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0e3NlbGVjdG9yfVxuXHRcdFx0XHRcdHtvcHRpb25zfVxuXHRcdFx0XHRcdHt2ZXJpZnlCdXR0b259XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8RGVwbG95UGxhbiBjb250ZXh0PXt0aGlzLnByb3BzLmNvbnRleHR9IHN1bW1hcnk9e3RoaXMuc3RhdGUuc3VtbWFyeX0gLz5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgU2VsZWN0b3JEcm9wZG93biA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdCQoUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLnNoYSkpLnNlbGVjdDIoe1xuXHRcdFx0Ly8gTG9hZCBkYXRhIGludG8gdGhlIHNlbGVjdDIuXG5cdFx0XHQvLyBUaGUgZm9ybWF0IHN1cHBvcnRzIG9wdGdyb3VwcywgYW5kIGxvb2tzIGxpa2UgdGhpczpcblx0XHRcdC8vIFt7dGV4dDogJ29wdGdyb3VwIHRleHQnLCBjaGlsZHJlbjogW3tpZDogJzxzaGE+JywgdGV4dDogJzxpbm5lciB0ZXh0Pid9XX1dXG5cdFx0XHRkYXRhOiB0aGlzLnByb3BzLnRhYi5maWVsZF9kYXRhXG5cdFx0fSk7XG5cblx0XHQvLyBUcmlnZ2VyIGhhbmRsZXIgb25seSBuZWVkZWQgaWYgdGhlcmUgaXMgbm8gZXhwbGljaXQgYnV0dG9uLlxuXHRcdGlmKHRoaXMucHJvcHMuY2hhbmdlSGFuZGxlcikge1xuXHRcdFx0JChSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuc2hhKSkuc2VsZWN0MigpLm9uKFwiY2hhbmdlXCIsIHRoaXMucHJvcHMuY2hhbmdlSGFuZGxlcik7XG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gRnJvbSBodHRwczovL3NlbGVjdDIuZ2l0aHViLmlvL2V4YW1wbGVzLmh0bWwgXCJUaGUgYmVzdCB3YXkgdG8gZW5zdXJlIHRoYXQgU2VsZWN0MiBpcyB1c2luZyBhIHBlcmNlbnQgYmFzZWRcblx0XHQvLyB3aWR0aCBpcyB0byBpbmxpbmUgdGhlIHN0eWxlIGRlY2xhcmF0aW9uIGludG8gdGhlIHRhZ1wiLlxuXHRcdHZhciBzdHlsZSA9IHt3aWR0aDogJzEwMCUnfTtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZpZWxkXCI+XG5cdFx0XHRcdFx0PHNlbGVjdFxuXHRcdFx0XHRcdFx0cmVmPVwic2hhXCJcblx0XHRcdFx0XHRcdGlkPXt0aGlzLnByb3BzLnRhYi5maWVsZF9pZH1cblx0XHRcdFx0XHRcdG5hbWU9XCJzaGFcIlxuXHRcdFx0XHRcdFx0Y2xhc3NOYW1lPVwiZHJvcGRvd25cIlxuXHRcdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMucHJvcHMuY2hhbmdlSGFuZGxlcn1cblx0XHRcdFx0XHRcdHN0eWxlPXtzdHlsZX0+XG5cdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiXCI+U2VsZWN0IHt0aGlzLnByb3BzLnRhYi5maWVsZF9pZH08L29wdGlvbj5cblx0XHRcdFx0XHQ8L3NlbGVjdD5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIFNlbGVjdG9yVGV4dCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4oXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZpZWxkXCI+XG5cdFx0XHRcdDxpbnB1dFxuXHRcdFx0XHRcdHR5cGU9XCJ0ZXh0XCJcblx0XHRcdFx0XHRyZWY9XCJzaGFcIlxuXHRcdFx0XHRcdGlkPXt0aGlzLnByb3BzLnRhYi5maWVsZF9pZH1cblx0XHRcdFx0XHRuYW1lPVwic2hhXCJcblx0XHRcdFx0XHRjbGFzc05hbWU9XCJ0ZXh0XCJcblx0XHRcdFx0XHRvbkNoYW5nZT17dGhpcy5wcm9wcy5jaGFuZ2VIYW5kbGVyfVxuXHRcdFx0XHQvPlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBWZXJpZnlCdXR0b24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiXCI+XG5cdFx0XHRcdDxidXR0b25cblx0XHRcdFx0XHRkaXNhYmxlZD17dGhpcy5wcm9wcy5kaXNhYmxlZH1cblx0XHRcdFx0XHR2YWx1ZT1cIlZlcmlmeSBkZXBsb3ltZW50XCJcblx0XHRcdFx0XHRjbGFzc05hbWU9XCJidG4gYnRuLWRlZmF1bHRcIlxuXHRcdFx0XHRcdG9uQ2xpY2s9e3RoaXMucHJvcHMuY2hhbmdlSGFuZGxlcn0+XG5cdFx0XHRcdFx0VmVyaWZ5IGRlcGxveW1lbnRcblx0XHRcdFx0PC9idXR0b24+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIEFkdmFuY2VkT3B0aW9ucyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZGVwbG95LW9wdGlvbnNcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmaWVsZGNoZWNrYm94XCI+XG5cdFx0XHRcdFx0PGxhYmVsPlxuXHRcdFx0XHRcdFx0PGlucHV0XG5cdFx0XHRcdFx0XHRcdHR5cGU9XCJjaGVja2JveFwiXG5cdFx0XHRcdFx0XHRcdG5hbWU9XCJmb3JjZV9mdWxsXCJcblx0XHRcdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMucHJvcHMuY2hhbmdlSGFuZGxlcn1cblx0XHRcdFx0XHRcdC8+XG5cdFx0XHRcdFx0XHRGb3JjZSBmdWxsIGRlcGxveW1lbnRcblx0XHRcdFx0XHQ8L2xhYmVsPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERlcGxveW1lbnREaWFsb2c7XG4iLCIvKipcbiAqIEEgc2ltcGxlIHB1YiBzdWIgZXZlbnQgaGFuZGxlciBmb3IgaW50ZXJjb21wb25lbnQgY29tbXVuaWNhdGlvblxuICovXG52YXIgdG9waWNzID0ge307XG52YXIgaE9QID0gdG9waWNzLmhhc093blByb3BlcnR5O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0c3Vic2NyaWJlOiBmdW5jdGlvbih0b3BpYywgbGlzdGVuZXIpIHtcblx0XHQvLyBDcmVhdGUgdGhlIHRvcGljJ3Mgb2JqZWN0IGlmIG5vdCB5ZXQgY3JlYXRlZFxuXHRcdGlmKCFoT1AuY2FsbCh0b3BpY3MsIHRvcGljKSkgdG9waWNzW3RvcGljXSA9IFtdO1xuXG5cdFx0Ly8gQWRkIHRoZSBsaXN0ZW5lciB0byBxdWV1ZVxuXHRcdHZhciBpbmRleCA9IHRvcGljc1t0b3BpY10ucHVzaChsaXN0ZW5lcikgLTE7XG5cblx0XHQvLyBQcm92aWRlIGhhbmRsZSBiYWNrIGZvciByZW1vdmFsIG9mIHRvcGljXG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlbW92ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGRlbGV0ZSB0b3BpY3NbdG9waWNdW2luZGV4XTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdHB1Ymxpc2g6IGZ1bmN0aW9uKHRvcGljLCBpbmZvKSB7XG5cdFx0Ly8gSWYgdGhlIHRvcGljIGRvZXNuJ3QgZXhpc3QsIG9yIHRoZXJlJ3Mgbm8gbGlzdGVuZXJzIGluIHF1ZXVlLCBqdXN0IGxlYXZlXG5cdFx0aWYoIWhPUC5jYWxsKHRvcGljcywgdG9waWMpKSByZXR1cm47XG5cblx0XHQvLyBDeWNsZSB0aHJvdWdoIHRvcGljcyBxdWV1ZSwgZmlyZSFcblx0XHR0b3BpY3NbdG9waWNdLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0aXRlbShpbmZvICE9IHVuZGVmaW5lZCA/IGluZm8gOiB7fSk7XG5cdFx0fSk7XG5cdH1cbn07XG4iLCIvKipcbiAqIEhlbHBlciBjbGFzcyB0byBjb25jYXRpbmF0ZSBzdHJpbmdzIGRlcGVkaW5nIG9uIGEgdHJ1ZSBvciBmYWxzZS5cbiAqXG4gKiBFeGFtcGxlOlxuICogdmFyIGNsYXNzZXMgPSBIZWxwZXJzLmNsYXNzTmFtZXMoe1xuICogICAgIFwiZGVwbG95LWRyb3Bkb3duXCI6IHRydWUsXG4gKiAgICAgXCJsb2FkaW5nXCI6IGZhbHNlLFxuICogICAgIFwib3BlblwiOiB0cnVlLFxuICogfSk7XG4gKlxuICogdGhlbiBjbGFzc2VzIHdpbGwgZXF1YWwgXCJkZXBsb3ktZHJvcGRvd24gb3BlblwiXG4gKlxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGNsYXNzTmFtZXM6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgY2xhc3NlcyA9ICcnO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgYXJnID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0aWYgKCFhcmcpIGNvbnRpbnVlO1xuXG5cdFx0XHR2YXIgYXJnVHlwZSA9IHR5cGVvZiBhcmc7XG5cblx0XHRcdGlmICgnc3RyaW5nJyA9PT0gYXJnVHlwZSB8fCAnbnVtYmVyJyA9PT0gYXJnVHlwZSkge1xuXHRcdFx0XHRjbGFzc2VzICs9ICcgJyArIGFyZztcblxuXHRcdFx0fSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcblx0XHRcdFx0Y2xhc3NlcyArPSAnICcgKyBjbGFzc05hbWVzLmFwcGx5KG51bGwsIGFyZyk7XG5cblx0XHRcdH0gZWxzZSBpZiAoJ29iamVjdCcgPT09IGFyZ1R5cGUpIHtcblx0XHRcdFx0Zm9yICh2YXIga2V5IGluIGFyZykge1xuXHRcdFx0XHRcdGlmIChhcmcuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBhcmdba2V5XSkge1xuXHRcdFx0XHRcdFx0Y2xhc3NlcyArPSAnICcgKyBrZXk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBjbGFzc2VzLnN1YnN0cigxKTtcblx0fVxufVxuIiwiXG4vKipcbiAqIEBqc3ggUmVhY3QuRE9NXG4gKi9cbnZhciBTdW1tYXJ5VGFibGUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGlzRW1wdHk6IGZ1bmN0aW9uKG9iaikge1xuXHRcdGZvciAodmFyIGtleSBpbiBvYmopIHtcblx0XHRcdGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSAmJiBvYmpba2V5XSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjaGFuZ2VzID0gdGhpcy5wcm9wcy5jaGFuZ2VzO1xuXHRcdGlmKHRoaXMuaXNFbXB0eShjaGFuZ2VzKSkge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHRcdHZhciBpZHggPSAwO1xuXHRcdHZhciBzdW1tYXJ5TGluZXMgPSBPYmplY3Qua2V5cyhjaGFuZ2VzKS5tYXAoZnVuY3Rpb24oa2V5KSB7XG5cdFx0XHRpZHgrKztcblxuXHRcdFx0dmFyIGNvbXBhcmVVcmwgPSBudWxsO1xuXHRcdFx0aWYodHlwZW9mIGNoYW5nZXNba2V5XS5jb21wYXJlVXJsICE9ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdGNvbXBhcmVVcmwgPSBjaGFuZ2VzW2tleV0uY29tcGFyZVVybDtcblx0XHRcdH1cblxuXHRcdFx0aWYodHlwZW9mIGNoYW5nZXNba2V5XS5kZXNjcmlwdGlvbiE9PSd1bmRlZmluZWQnKSB7XG5cblx0XHRcdFx0aWYgKGNoYW5nZXNba2V5XS5kZXNjcmlwdGlvbiE9PVwiXCIpIHtcblx0XHRcdFx0XHRyZXR1cm4gPERlc2NyaXB0aW9uT25seVN1bW1hcnlMaW5lIGtleT17aWR4fSBuYW1lPXtrZXl9IGRlc2NyaXB0aW9uPXtjaGFuZ2VzW2tleV0uZGVzY3JpcHRpb259IC8+XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIDxVbmNoYW5nZWRTdW1tYXJ5TGluZSBrZXk9e2lkeH0gbmFtZT17a2V5fSB2YWx1ZT1cIlwiIC8+XG5cdFx0XHRcdH1cblxuXHRcdFx0fSBlbHNlIGlmKGNoYW5nZXNba2V5XS5mcm9tICE9IGNoYW5nZXNba2V5XS50bykge1xuXHRcdFx0XHRyZXR1cm4gPFN1bW1hcnlMaW5lIGtleT17aWR4fSBuYW1lPXtrZXl9IGZyb209e2NoYW5nZXNba2V5XS5mcm9tfSB0bz17Y2hhbmdlc1trZXldLnRvfSBjb21wYXJlVXJsPXtjb21wYXJlVXJsfSAvPlxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIDxVbmNoYW5nZWRTdW1tYXJ5TGluZSBrZXk9e2lkeH0gbmFtZT17a2V5fSB2YWx1ZT17Y2hhbmdlc1trZXldLmZyb219IC8+XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PHRhYmxlIGNsYXNzTmFtZT1cInRhYmxlIHRhYmxlLXN0cmlwZWQgdGFibGUtaG92ZXJcIj5cblx0XHRcdFx0PHRib2R5PlxuXHRcdFx0XHRcdHtzdW1tYXJ5TGluZXN9XG5cdFx0XHRcdDwvdGJvZHk+XG5cdFx0XHQ8L3RhYmxlPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgU3VtbWFyeUxpbmUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGZyb20gPSB0aGlzLnByb3BzLmZyb20sXG5cdFx0XHR0byA9IHRoaXMucHJvcHMudG87XG5cblx0XHQvLyBuYWl2ZSBnaXQgc2hhIGRldGVjdGlvblxuXHRcdGlmKGZyb20gIT09IG51bGwgJiYgZnJvbS5sZW5ndGggPT09IDQwKSB7XG5cdFx0XHRmcm9tID0gZnJvbS5zdWJzdHJpbmcoMCw3KTtcblx0XHR9XG5cblx0XHQvLyBuYWl2ZSBnaXQgc2hhIGRldGVjdGlvblxuXHRcdGlmKHRvICE9PSBudWxsICYmIHRvLmxlbmd0aCA9PT0gNDApIHtcblx0XHRcdHRvID0gdG8uc3Vic3RyaW5nKDAsNyk7XG5cdFx0fVxuXG5cdFx0dmFyIGNvbXBhcmVVcmwgPSBudWxsO1xuXHRcdGlmKHRoaXMucHJvcHMuY29tcGFyZVVybCAhPT0gbnVsbCkge1xuXHRcdFx0Y29tcGFyZVVybCA9IDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9e3RoaXMucHJvcHMuY29tcGFyZVVybH0+VmlldyBkaWZmPC9hPlxuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8dHI+XG5cdFx0XHRcdDx0aCBzY29wZT1cInJvd1wiPnt0aGlzLnByb3BzLm5hbWV9PC90aD5cblx0XHRcdFx0PHRkPntmcm9tfTwvdGQ+XG5cdFx0XHRcdDx0ZD48c3BhbiBjbGFzc05hbWU9XCJnbHlwaGljb24gZ2x5cGhpY29uLWFycm93LXJpZ2h0XCIgLz48L3RkPlxuXHRcdFx0XHQ8dGQ+e3RvfTwvdGQ+XG5cdFx0XHRcdDx0ZCBjbGFzc05hbWU9XCJjaGFuZ2VBY3Rpb25cIj57Y29tcGFyZVVybH08L3RkPlxuXHRcdFx0PC90cj5cblx0XHQpXG5cdH1cbn0pO1xuXG52YXIgVW5jaGFuZ2VkU3VtbWFyeUxpbmUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGZyb20gPSB0aGlzLnByb3BzLnZhbHVlO1xuXHRcdC8vIG5haXZlIGdpdCBzaGEgZGV0ZWN0aW9uXG5cdFx0aWYoZnJvbSAhPT0gbnVsbCAmJiBmcm9tLmxlbmd0aCA9PT0gNDApIHtcblx0XHRcdGZyb20gPSBmcm9tLnN1YnN0cmluZygwLDcpO1xuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8dHI+XG5cdFx0XHRcdDx0aCBzY29wZT1cInJvd1wiPnt0aGlzLnByb3BzLm5hbWV9PC90aD5cblx0XHRcdFx0PHRkPntmcm9tfTwvdGQ+XG5cdFx0XHRcdDx0ZD4mbmJzcDs8L3RkPlxuXHRcdFx0XHQ8dGQ+PHNwYW4gY2xhc3NOYW1lPVwibGFiZWwgbGFiZWwtc3VjY2Vzc1wiPlVuY2hhbmdlZDwvc3Bhbj48L3RkPlxuXHRcdFx0XHQ8dGQ+Jm5ic3A7PC90ZD5cblx0XHRcdDwvdHI+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBEZXNjcmlwdGlvbk9ubHlTdW1tYXJ5TGluZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PHRyPlxuXHRcdFx0XHQ8dGggc2NvcGU9XCJyb3dcIj57dGhpcy5wcm9wcy5uYW1lfTwvdGg+XG5cdFx0XHRcdDx0ZCBjb2xTcGFuPVwiNFwiIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7X19odG1sOiB0aGlzLnByb3BzLmRlc2NyaXB0aW9ufX0gLz5cblx0XHRcdDwvdHI+XG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3VtbWFyeVRhYmxlO1xuIl19
