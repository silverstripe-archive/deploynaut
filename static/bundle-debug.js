(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
		var extraDefinitions = [];
		if (this.props.summary.estimatedTime && this.props.summary.estimatedTime>0) {
			extraDefinitions.push(React.createElement("dt", {key: "duration_term"}, "Duration:"));
			extraDefinitions.push(React.createElement("dd", {key: "duration_definition"}, this.props.summary.estimatedTime, " min approx."));
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

		var env;
		if (this.props.context.siteUrl) {
			env = React.createElement("a", {target: "_blank", href: this.props.context.siteUrl}, this.props.context.envName);
		} else {
			env = React.createElement("span", null, this.props.context.envName);
		}

		return (
			React.createElement("dl", {className: dlClasses}, 
				React.createElement("dt", null, "Environment:"), 
				React.createElement("dd", null, env), 
				React.createElement("dt", null, "Deploy type:"), 
				React.createElement("dd", null, type, " ", moreInfo), 
				extraDefinitions
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

},{"./events.js":3,"./helpers.js":4,"./summary_table.jsx":6}],2:[function(require,module,exports){
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
			data: [],
			preselectSha: null
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
			url: this.props.context.gitRevisionsUrl
		})).then(function(data) {
			self.setState({
				loading: false,
				data: data.Tabs,
				selectedTab: data.preselect_tab ? parseInt(data.preselect_tab) : 1,
				preselectSha: data.preselect_sha
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
					React.createElement(DeployTabs, {context: this.props.context, data: this.state.data, selectedTab: this.state.selectedTab, 
						preselectSha: this.state.preselectSha, SecurityToken: this.state.SecurityToken})
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
				React.createElement(DeployTab, {context: self.props.context, key: tab.id, tab: tab, selectedTab: self.props.selectedTab, 
					preselectSha: self.props.selectedTab==tab.id ? self.props.preselectSha : null, 
					SecurityToken: self.props.SecurityToken})
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
			sha: this.props.preselectSha ? this.props.preselectSha : ''
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
	componentDidMount: function() {
		if (this.shaChosen()) {
			this.changeSha(this.state.sha);
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
	changeSha: function(sha) {

		this.setState({
			summary: this.getInitialSummaryState()
		});

		Events.publish('change_loading');

		var branch = null;

		for (var i in this.props.tab.field_data) {
			if (this.props.tab.field_data[i].id === sha) {
				branch = this.props.tab.field_data[i].branch_name;
			}
		}

		var summaryData = {
			sha: sha,
			branch: branch,
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

	changeHandler: function(event) {
		event.preventDefault();
		if(event.target.value === "") {
			return;
		}
		var sha = React.findDOMNode(this.refs.sha_selector.refs.sha).value;
		return this.changeSha(sha);
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
			selector = React.createElement(SelectorDropdown, {ref: "sha_selector", tab: this.props.tab, 
				changeHandler: changeHandler, defaultValue: this.state.sha})
		} else if (this.props.tab.field_type == 'textfield') {
			selector = React.createElement(SelectorText, {ref: "sha_selector", tab: this.props.tab, 
				changeHandler: this.SHAChangeHandler, defaultValue: this.state.sha})
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
			data: this.props.tab.field_data,
		}).val(this.props.defaultValue);

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
					defaultValue: this.props.defaultValue, 
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
				), 
				React.createElement("div", {className: "fieldcheckbox"}, 
					React.createElement("label", null, 
						React.createElement("input", {
							type: "checkbox", 
							name: "norollback", 
							onChange: this.props.changeHandler}
						), 
						"No rollback on deploy failure"
					)
				)
			)
		);
	}
});

module.exports = DeploymentDialog;

},{"./deploy_plan.jsx":1,"./events.js":3,"./helpers.js":4}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
var DeploymentDialog = require('./deployment_dialog.jsx');

// Mount the component only on the page where the holder is actually present.
var holder = document.getElementById('deployment-dialog-holder');
if (holder) {
	React.render(
		React.createElement(DeploymentDialog, {context: environmentConfigContext}),
		holder
	);
}

},{"./deployment_dialog.jsx":2}],6:[function(require,module,exports){

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
					return React.createElement(DescriptionOnlySummaryLine, {key: idx, name: key, description: changes[key].description, compareUrl: compareUrl})
				} else {
					return React.createElement(UnchangedSummaryLine, {key: idx, name: key, value: ""})
				}

			} else if(changes[key].from != changes[key].to) {
				return React.createElement(SummaryLine, {key: idx, name: key, from: changes[key].from, to: changes[key].to, compareUrl: compareUrl})
			} else if(typeof changes[key].from !== 'undefined') {
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
		var compareColumn = null;
		var colSpan = "4";
		if(this.props.compareUrl !== null) {
			compareColumn = React.createElement("td", {className: "changeAction"}, React.createElement("a", {target: "_blank", href: this.props.compareUrl}, "View diff"));
			colSpan = "3";
		}

		return (
			React.createElement("tr", null, 
				React.createElement("th", {scope: "row"}, this.props.name), 
				React.createElement("td", {colSpan: colSpan, dangerouslySetInnerHTML: {__html: this.props.description}}), 
				compareColumn
			)
		);
	}
});

module.exports = SummaryTable;

},{}]},{},[5])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvc2hhcnZleS9TaXRlcy9wbGF0Zm9ybS1kYXNoYm9hcmQvZGVwbG95bmF1dC9qcy9kZXBsb3lfcGxhbi5qc3giLCIvVXNlcnMvc2hhcnZleS9TaXRlcy9wbGF0Zm9ybS1kYXNoYm9hcmQvZGVwbG95bmF1dC9qcy9kZXBsb3ltZW50X2RpYWxvZy5qc3giLCIvVXNlcnMvc2hhcnZleS9TaXRlcy9wbGF0Zm9ybS1kYXNoYm9hcmQvZGVwbG95bmF1dC9qcy9ldmVudHMuanMiLCIvVXNlcnMvc2hhcnZleS9TaXRlcy9wbGF0Zm9ybS1kYXNoYm9hcmQvZGVwbG95bmF1dC9qcy9oZWxwZXJzLmpzIiwiL1VzZXJzL3NoYXJ2ZXkvU2l0ZXMvcGxhdGZvcm0tZGFzaGJvYXJkL2RlcGxveW5hdXQvanMvcGxhdGZvcm0uanN4IiwiL1VzZXJzL3NoYXJ2ZXkvU2l0ZXMvcGxhdGZvcm0tZGFzaGJvYXJkL2RlcGxveW5hdXQvanMvc3VtbWFyeV90YWJsZS5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDcEMsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3RDLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDOztBQUVsRCxJQUFJLGdDQUFnQywwQkFBQTtDQUNuQyxVQUFVLEVBQUUsSUFBSTtDQUNoQixjQUFjLEVBQUUsSUFBSTtDQUNwQixlQUFlLEVBQUUsV0FBVztFQUMzQixPQUFPO0dBQ04sZUFBZSxFQUFFLEtBQUs7R0FDdEIsZUFBZSxFQUFFLEtBQUs7R0FDdEIsV0FBVyxFQUFFLEtBQUs7R0FDbEI7RUFDRDtDQUNELGlCQUFpQixFQUFFLFdBQVc7QUFDL0IsRUFBRSxJQUFJLElBQUksR0FB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O0dBQ2xDLGFBQWEsR0FBRyxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLFNBQUEsRUFBUyxDQUFDLGNBQWUsQ0FBQSxFQUFBLG9CQUFBLEdBQUUsRUFBQSxDQUFBLENBQUMsTUFBQSxFQUFNLENBQUMsUUFBQSxFQUFRLENBQUMsSUFBQSxFQUFJLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFZLENBQUEsRUFBQSxXQUFhLENBQUssQ0FBQSxDQUFDO0dBQ2hILE9BQU8sR0FBRyxHQUFHLENBQUM7QUFDakIsR0FBRzs7RUFFRDtHQUNDLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUE7SUFDSCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLEtBQUEsRUFBSyxDQUFDLEtBQU0sQ0FBQSxFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBVSxDQUFBLEVBQUE7SUFDdEMsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxPQUFBLEVBQU8sQ0FBRSxPQUFPLEVBQUMsQ0FBQyx1QkFBQSxFQUF1QixDQUFFLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFFLENBQUEsQ0FBRyxDQUFBLEVBQUE7SUFDbEYsYUFBYztHQUNYLENBQUE7SUFDSjtFQUNGO0FBQ0YsQ0FBQyxDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxZQUFZLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XG52YXIgSGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycy5qcycpO1xudmFyIFN1bW1hcnlUYWJsZSA9IHJlcXVpcmUoJy4vc3VtbWFyeV90YWJsZS5qc3gnKTtcblxudmFyIERlcGxveVBsYW4gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGxvYWRpbmdTdWI6IG51bGwsXG5cdGxvYWRpbmdEb25lU3ViOiBudWxsLFxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRsb2FkaW5nX2NoYW5nZXM6IGZhbHNlLFxuXHRcdFx0ZGVwbG95X2Rpc2FibGVkOiBmYWxzZSxcblx0XHRcdGRlcGxveUhvdmVyOiBmYWxzZVxuXHRcdH1cblx0fSxcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHQvLyByZWdpc3RlciBzdWJzY3JpYmVyc1xuXHRcdHRoaXMubG9hZGluZ1N1YiA9IEV2ZW50cy5zdWJzY3JpYmUoJ2NoYW5nZV9sb2FkaW5nJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdGxvYWRpbmdfY2hhbmdlczogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdFx0dGhpcy5sb2FkaW5nRG9uZVN1YiA9IEV2ZW50cy5zdWJzY3JpYmUoJ2NoYW5nZV9sb2FkaW5nL2RvbmUnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0bG9hZGluZ19jaGFuZ2VzOiBmYWxzZVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0sXG5cdGRlcGxveUhhbmRsZXI6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGRlcGxveV9kaXNhYmxlZDogdHJ1ZVxuXHRcdH0pO1xuXG5cdFx0USgkLmFqYXgoe1xuXHRcdFx0dHlwZTogXCJQT1NUXCIsXG5cdFx0XHRkYXRhVHlwZTogJ2pzb24nLFxuXHRcdFx0dXJsOiB0aGlzLnByb3BzLmNvbnRleHQuZW52VXJsICsgJy9zdGFydC1kZXBsb3knLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHQvLyBQYXNzIHRoZSBzdHJhdGVneSBvYmplY3QgdGhlIHVzZXIgaGFzIGp1c3Qgc2lnbmVkIG9mZiBiYWNrIHRvIHRoZSBiYWNrZW5kLlxuXHRcdFx0XHQnc3RyYXRlZ3knOiB0aGlzLnByb3BzLnN1bW1hcnksXG5cdFx0XHRcdCdTZWN1cml0eUlEJzogdGhpcy5wcm9wcy5zdW1tYXJ5LlNlY3VyaXR5SURcblx0XHRcdH1cblx0XHR9KSkudGhlbihmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHR3aW5kb3cubG9jYXRpb24gPSBkYXRhLnVybDtcblx0XHR9LCBmdW5jdGlvbihkYXRhKXtcblx0XHRcdGNvbnNvbGUuZXJyb3IoZGF0YSk7XG5cdFx0fSk7XG5cdH0sXG5cdG1vdXNlRW50ZXJIYW5kbGVyOiBmdW5jdGlvbihldmVudCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe2RlcGxveUhvdmVyOiB0cnVlfSk7XG5cdH0sXG5cdG1vdXNlTGVhdmVIYW5kbGVyOiBmdW5jdGlvbihldmVudCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe2RlcGxveUhvdmVyOiBmYWxzZX0pO1xuXHR9LFxuXHRjYW5EZXBsb3k6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAodGhpcy5wcm9wcy5zdW1tYXJ5LnZhbGlkYXRpb25Db2RlPT09XCJzdWNjZXNzXCIgfHwgdGhpcy5wcm9wcy5zdW1tYXJ5LnZhbGlkYXRpb25Db2RlPT09XCJ3YXJuaW5nXCIpO1xuXHR9LFxuXHRpc0VtcHR5OiBmdW5jdGlvbihvYmopIHtcblx0XHRmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG5cdFx0XHRpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkgJiYgb2JqW2tleV0pIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblx0c2hvd05vQ2hhbmdlc01lc3NhZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzdW1tYXJ5ID0gdGhpcy5wcm9wcy5zdW1tYXJ5O1xuXHRcdGlmKHN1bW1hcnkuaW5pdGlhbFN0YXRlID09PSB0cnVlKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdGlmKHN1bW1hcnkubWVzc2FnZXMgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdFx0cmV0dXJuICh0aGlzLmlzRW1wdHkoc3VtbWFyeS5jaGFuZ2VzKSAmJiBzdW1tYXJ5Lm1lc3NhZ2VzLmxlbmd0aCA9PT0gMCk7XG5cdH0sXG5cdGFjdGlvblRpdGxlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgYWN0aW9uVGl0bGUgPSB0aGlzLnByb3BzLnN1bW1hcnkuYWN0aW9uVGl0bGU7XG5cdFx0aWYgKHR5cGVvZiBhY3Rpb25UaXRsZSA9PT0gJ3VuZGVmaW5lZCcgfHwgYWN0aW9uVGl0bGUgPT09ICcnICkge1xuXHRcdFx0cmV0dXJuICdNYWtlIGEgc2VsZWN0aW9uJztcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMucHJvcHMuc3VtbWFyeS5hY3Rpb25UaXRsZTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbWVzc2FnZXMgPSB0aGlzLnByb3BzLnN1bW1hcnkubWVzc2FnZXM7XG5cdFx0aWYgKHRoaXMuc2hvd05vQ2hhbmdlc01lc3NhZ2UoKSkge1xuXHRcdFx0bWVzc2FnZXMgPSBbe1xuXHRcdFx0XHR0ZXh0OiBcIlRoZXJlIGFyZSBubyBjaGFuZ2VzIGJ1dCB5b3UgY2FuIGRlcGxveSBhbnl3YXkgaWYgeW91IHdpc2guXCIsXG5cdFx0XHRcdGNvZGU6IFwic3VjY2Vzc1wiXG5cdFx0XHR9XTtcblx0XHR9XG5cblx0XHR2YXIgZGVwbG95QWN0aW9uO1xuXHRcdGlmKHRoaXMuY2FuRGVwbG95KCkpIHtcblx0XHRcdGRlcGxveUFjdGlvbiA9IChcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZWN0aW9uXCJcblx0XHRcdFx0XHRvbk1vdXNlRW50ZXI9e3RoaXMubW91c2VFbnRlckhhbmRsZXJ9XG5cdFx0XHRcdFx0b25Nb3VzZUxlYXZlPXt0aGlzLm1vdXNlTGVhdmVIYW5kbGVyfT5cblx0XHRcdFx0XHRcdDxidXR0b25cblx0XHRcdFx0XHRcdFx0dmFsdWU9XCJDb25maXJtIERlcGxveW1lbnRcIlxuXHRcdFx0XHRcdFx0XHRjbGFzc05hbWU9XCJkZXBsb3kgcHVsbC1sZWZ0XCJcblx0XHRcdFx0XHRcdFx0ZGlzYWJsZWQ9e3RoaXMuc3RhdGUuZGVwbG95X2Rpc2FibGVkfVxuXHRcdFx0XHRcdFx0XHRvbkNsaWNrPXt0aGlzLmRlcGxveUhhbmRsZXJ9PlxuXHRcdFx0XHRcdFx0XHR7dGhpcy5hY3Rpb25UaXRsZSgpfVxuXHRcdFx0XHRcdFx0PC9idXR0b24+XG5cdFx0XHRcdFx0XHQ8UXVpY2tTdW1tYXJ5IGFjdGl2YXRlZD17dGhpcy5zdGF0ZS5kZXBsb3lIb3Zlcn0gY29udGV4dD17dGhpcy5wcm9wcy5jb250ZXh0fSBzdW1tYXJ5PXt0aGlzLnByb3BzLnN1bW1hcnl9IC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHR2YXIgaGVhZGVyQ2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG5cdFx0XHRoZWFkZXI6IHRydWUsXG5cdFx0XHRpbmFjdGl2ZTogIXRoaXMuY2FuRGVwbG95KCksXG5cdFx0XHRsb2FkaW5nOiB0aGlzLnN0YXRlLmxvYWRpbmdfY2hhbmdlc1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuKFxuXHRcdFx0PGRpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZWN0aW9uXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9e2hlYWRlckNsYXNzZXN9PlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwic3RhdHVzLWljb25cIj48L3NwYW4+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJudW1iZXJDaXJjbGVcIj4yPC9zcGFuPiBSZXZpZXcgY2hhbmdlc1xuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdDxNZXNzYWdlTGlzdCBtZXNzYWdlcz17bWVzc2FnZXN9IC8+XG5cdFx0XHRcdFx0PFN1bW1hcnlUYWJsZSBjaGFuZ2VzPXt0aGlzLnByb3BzLnN1bW1hcnkuY2hhbmdlc30gLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdHtkZXBsb3lBY3Rpb259XG5cdFx0XHQ8L2Rpdj5cblx0XHQpXG5cdH1cbn0pO1xuXG52YXIgUXVpY2tTdW1tYXJ5ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0eXBlID0gKHRoaXMucHJvcHMuc3VtbWFyeS5hY3Rpb25Db2RlPT09J2Zhc3QnID8gJ2NvZGUtb25seScgOiAnZnVsbCcpO1xuXHRcdHZhciBleHRyYURlZmluaXRpb25zID0gW107XG5cdFx0aWYgKHRoaXMucHJvcHMuc3VtbWFyeS5lc3RpbWF0ZWRUaW1lICYmIHRoaXMucHJvcHMuc3VtbWFyeS5lc3RpbWF0ZWRUaW1lPjApIHtcblx0XHRcdGV4dHJhRGVmaW5pdGlvbnMucHVzaCg8ZHQga2V5PVwiZHVyYXRpb25fdGVybVwiPkR1cmF0aW9uOjwvZHQ+KTtcblx0XHRcdGV4dHJhRGVmaW5pdGlvbnMucHVzaCg8ZGQga2V5PVwiZHVyYXRpb25fZGVmaW5pdGlvblwiPnt0aGlzLnByb3BzLnN1bW1hcnkuZXN0aW1hdGVkVGltZX0gbWluIGFwcHJveC48L2RkPik7XG5cdFx0fVxuXG5cdFx0dmFyIGRsQ2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG5cdFx0XHRhY3RpdmF0ZWQ6IHRoaXMucHJvcHMuYWN0aXZhdGVkLFxuXHRcdFx0J3F1aWNrLXN1bW1hcnknOiB0cnVlXG5cdFx0fSk7XG5cblx0XHR2YXIgbW9yZUluZm8gPSBudWxsO1xuXHRcdGlmICh0eXBlb2YgdGhpcy5wcm9wcy5jb250ZXh0LmRlcGxveUhlbHAhPT0ndW5kZWZpbmVkJyAmJiB0aGlzLnByb3BzLmNvbnRleHQuZGVwbG95SGVscCkge1xuXHRcdFx0bW9yZUluZm8gPSAoXG5cdFx0XHRcdDxhIHRhcmdldD1cIl9ibGFua1wiIGNsYXNzTmFtZT1cInNtYWxsXCIgaHJlZj17dGhpcy5wcm9wcy5jb250ZXh0LmRlcGxveUhlbHB9Pm1vcmUgaW5mbzwvYT5cblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0dmFyIGVudjtcblx0XHRpZiAodGhpcy5wcm9wcy5jb250ZXh0LnNpdGVVcmwpIHtcblx0XHRcdGVudiA9IDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9e3RoaXMucHJvcHMuY29udGV4dC5zaXRlVXJsfT57dGhpcy5wcm9wcy5jb250ZXh0LmVudk5hbWV9PC9hPjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZW52ID0gPHNwYW4+e3RoaXMucHJvcHMuY29udGV4dC5lbnZOYW1lfTwvc3Bhbj47XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkbCBjbGFzc05hbWU9e2RsQ2xhc3Nlc30+XG5cdFx0XHRcdDxkdD5FbnZpcm9ubWVudDo8L2R0PlxuXHRcdFx0XHQ8ZGQ+e2Vudn08L2RkPlxuXHRcdFx0XHQ8ZHQ+RGVwbG95IHR5cGU6PC9kdD5cblx0XHRcdFx0PGRkPnt0eXBlfSB7bW9yZUluZm99PC9kZD5cblx0XHRcdFx0e2V4dHJhRGVmaW5pdGlvbnN9XG5cdFx0XHQ8L2RsPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgTWVzc2FnZUxpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYodGhpcy5wcm9wcy5tZXNzYWdlcy5sZW5ndGggPCAxKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdFx0aWYodHlwZW9mIHRoaXMucHJvcHMubWVzc2FnZXMgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdFx0dmFyIGlkeCA9IDA7XG5cdFx0dmFyIG1lc3NhZ2VzID0gdGhpcy5wcm9wcy5tZXNzYWdlcy5tYXAoZnVuY3Rpb24obWVzc2FnZSkge1xuXHRcdFx0aWR4Kys7XG5cdFx0XHRyZXR1cm4gPE1lc3NhZ2Uga2V5PXtpZHh9IG1lc3NhZ2U9e21lc3NhZ2V9IC8+XG5cdFx0fSk7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXY+XG5cdFx0XHRcdHttZXNzYWdlc31cblx0XHRcdDwvZGl2PlxuXHRcdClcblx0fVxufSk7XG5cbnZhciBNZXNzYWdlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjbGFzc01hcCA9IHtcblx0XHRcdCdlcnJvcic6ICdhbGVydCBhbGVydC1kYW5nZXInLFxuXHRcdFx0J3dhcm5pbmcnOiAnYWxlcnQgYWxlcnQtd2FybmluZycsXG5cdFx0XHQnc3VjY2Vzcyc6ICdhbGVydCBhbGVydC1pbmZvJ1xuXHRcdH07XG5cdFx0dmFyIGNsYXNzbmFtZT1jbGFzc01hcFt0aGlzLnByb3BzLm1lc3NhZ2UuY29kZV07XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPXtjbGFzc25hbWV9IHJvbGU9XCJhbGVydFwiXG5cdFx0XHRcdGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7X19odG1sOiB0aGlzLnByb3BzLm1lc3NhZ2UudGV4dH19IC8+XG5cdFx0KVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEZXBsb3lQbGFuO1xuIiwidmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XG52YXIgSGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycy5qcycpO1xudmFyIERlcGxveVBsYW4gPSByZXF1aXJlKCcuL2RlcGxveV9wbGFuLmpzeCcpO1xuXG52YXIgRGVwbG95bWVudERpYWxvZyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuXHRsb2FkaW5nU3ViOiBudWxsLFxuXG5cdGxvYWRpbmdEb25lU3ViOiBudWxsLFxuXG5cdGVycm9yU3ViOiBudWxsLFxuXG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGxvYWRpbmc6IGZhbHNlLFxuXHRcdFx0bG9hZGluZ1RleHQ6IFwiXCIsXG5cdFx0XHRlcnJvclRleHQ6IFwiXCIsXG5cdFx0XHRmZXRjaGVkOiB0cnVlLFxuXHRcdFx0bGFzdF9mZXRjaGVkOiBcIlwiXG5cdFx0fTtcblx0fSxcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHQvLyBhZGQgc3Vic2NyaWJlcnNcblx0XHR0aGlzLmxvYWRpbmdTdWIgPSBFdmVudHMuc3Vic2NyaWJlKCdsb2FkaW5nJywgZnVuY3Rpb24odGV4dCkge1xuXHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdGxvYWRpbmc6IHRydWUsXG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRsb2FkaW5nVGV4dDogdGV4dFxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdFx0dGhpcy5sb2FkaW5nRG9uZVN1YiA9IEV2ZW50cy5zdWJzY3JpYmUoJ2xvYWRpbmcvZG9uZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdGxvYWRpbmc6IGZhbHNlLFxuXHRcdFx0XHRsb2FkaW5nVGV4dDogJycsXG5cdFx0XHRcdHN1Y2Nlc3M6IHRydWVcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdHRoaXMuZXJyb3JTdWIgPSBFdmVudHMuc3Vic2NyaWJlKCdlcnJvcicsIGZ1bmN0aW9uKHRleHQpIHtcblx0XHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0XHRlcnJvclRleHQ6IHRleHQsXG5cdFx0XHRcdGxvYWRpbmc6IGZhbHNlLFxuXHRcdFx0XHRsb2FkaW5nVGV4dDogJycsXG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fSxcblx0Y29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHJlbW92ZSBzdWJzY3JpYmVyc1xuXHRcdHRoaXMubG9hZGluZ1N1Yi5yZW1vdmUoKTtcblx0XHR0aGlzLmxvYWRpbmdEb25lU3ViLnJlbW92ZSgpO1xuXHRcdHRoaXMuZXJyb3JTdWIucmVtb3ZlKCk7XG5cdH0sXG5cdGhhbmRsZUNsaWNrOiBmdW5jdGlvbihlKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdEV2ZW50cy5wdWJsaXNoKCdsb2FkaW5nJywgXCJGZXRjaGluZyBsYXRlc3QgY29kZeKAplwiKTtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGZldGNoZWQ6IGZhbHNlXG5cdFx0fSk7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdFEoJC5hamF4KHtcblx0XHRcdHR5cGU6IFwiUE9TVFwiLFxuXHRcdFx0ZGF0YVR5cGU6ICdqc29uJyxcblx0XHRcdHVybDogdGhpcy5wcm9wcy5jb250ZXh0LnByb2plY3RVcmwgKyAnL2ZldGNoJ1xuXHRcdH0pKVxuXHRcdFx0LnRoZW4odGhpcy53YWl0Rm9yRmV0Y2hUb0NvbXBsZXRlLCB0aGlzLmZldGNoU3RhdHVzRXJyb3IpXG5cdFx0XHQudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0RXZlbnRzLnB1Ymxpc2goJ2xvYWRpbmcvZG9uZScpO1xuXHRcdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0XHRmZXRjaGVkOiB0cnVlXG5cdFx0XHRcdH0pXG5cdFx0XHR9KS5jYXRjaCh0aGlzLmZldGNoU3RhdHVzRXJyb3IpLmRvbmUoKTtcblx0fSxcblx0d2FpdEZvckZldGNoVG9Db21wbGV0ZTpmdW5jdGlvbiAoZmV0Y2hEYXRhKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHJldHVybiB0aGlzLmdldEZldGNoU3RhdHVzKGZldGNoRGF0YSkudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuXHRcdFx0aWYgKGRhdGEuc3RhdHVzID09PSBcIkNvbXBsZXRlXCIpIHtcblx0XHRcdFx0cmV0dXJuIGRhdGE7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZGF0YS5zdGF0dXMgPT09IFwiRmFpbGVkXCIpIHtcblx0XHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0XHRyZXR1cm4gZC5yZWplY3QoZGF0YSk7XG5cdFx0XHRcdH0pLnByb21pc2UoKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBzZWxmLndhaXRGb3JGZXRjaFRvQ29tcGxldGUoZmV0Y2hEYXRhKTtcblx0XHR9KTtcblx0fSxcblx0Z2V0RmV0Y2hTdGF0dXM6IGZ1bmN0aW9uIChmZXRjaERhdGEpIHtcblx0XHRyZXR1cm4gUSgkLmFqYXgoe1xuXHRcdFx0dHlwZTogXCJHRVRcIixcblx0XHRcdHVybDogZmV0Y2hEYXRhLmhyZWYsXG5cdFx0XHRkYXRhVHlwZTogJ2pzb24nXG5cdFx0fSkpO1xuXHR9LFxuXHRmZXRjaFN0YXR1c0Vycm9yOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dmFyIG1lc3NhZ2UgID0gJ1Vua25vd24gZXJyb3InO1xuXHRcdGlmKHR5cGVvZiBkYXRhLnJlc3BvbnNlVGV4dCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdG1lc3NhZ2UgPSBkYXRhLnJlc3BvbnNlVGV4dDtcblx0XHR9IGVsc2UgaWYgKHR5cGVvZiBkYXRhLm1lc3NhZ2UgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRtZXNzYWdlID0gZGF0YS5tZXNzYWdlO1xuXHRcdH1cblx0XHRFdmVudHMucHVibGlzaCgnZXJyb3InLCBtZXNzYWdlKTtcblx0fSxcblx0bGFzdEZldGNoZWRIYW5kbGVyOiBmdW5jdGlvbih0aW1lX2Fnbykge1xuXHRcdHRoaXMuc2V0U3RhdGUoe2xhc3RfZmV0Y2hlZDogdGltZV9hZ299KTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG5cdFx0XHRcImRlcGxveS1kcm9wZG93blwiOiB0cnVlLFxuXHRcdFx0XCJsb2FkaW5nXCI6IHRoaXMuc3RhdGUubG9hZGluZyxcblx0XHRcdFwic3VjY2Vzc1wiOiB0aGlzLnN0YXRlLnN1Y2Nlc3Ncblx0XHR9KTtcblxuXHRcdHZhciBmb3JtO1xuXG5cdFx0aWYodGhpcy5zdGF0ZS5lcnJvclRleHQgIT09IFwiXCIpIHtcblx0XHRcdGZvcm0gPSA8RXJyb3JNZXNzYWdlcyBtZXNzYWdlPXt0aGlzLnN0YXRlLmVycm9yVGV4dH0gLz5cblx0XHR9IGVsc2UgaWYodGhpcy5zdGF0ZS5mZXRjaGVkKSB7XG5cdFx0XHRmb3JtID0gPERlcGxveUZvcm0gY29udGV4dD17dGhpcy5wcm9wcy5jb250ZXh0fSBkYXRhPXt0aGlzLnByb3BzLmRhdGF9IGxhc3RGZXRjaGVkSGFuZGxlcj17dGhpcy5sYXN0RmV0Y2hlZEhhbmRsZXJ9IC8+XG5cdFx0fSBlbHNlIGlmICh0aGlzLnN0YXRlLmxvYWRpbmcpIHtcblx0XHRcdGZvcm0gPSA8TG9hZGluZ0RlcGxveUZvcm0gbWVzc2FnZT1cIkZldGNoaW5nIGxhdGVzdCBjb2RlJmhlbGxpcDtcIiAvPlxuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT17Y2xhc3Nlc30gb25DbGljaz17dGhpcy5oYW5kbGVDbGlja30+XG5cdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwic3RhdHVzLWljb25cIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+XG5cdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwidGltZVwiPmxhc3QgdXBkYXRlZCB7dGhpcy5zdGF0ZS5sYXN0X2ZldGNoZWR9PC9zcGFuPlxuXHRcdFx0XHRcdDxFbnZpcm9ubWVudE5hbWUgZW52aXJvbm1lbnROYW1lPXt0aGlzLnByb3BzLmNvbnRleHQuZW52TmFtZX0gLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdHtmb3JtfVxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBMb2FkaW5nRGVwbG95Rm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJkZXBsb3ktZm9ybS1sb2FkaW5nXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiaWNvbi1ob2xkZXJcIj5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1jb2cgZmEtc3BpblwiPjwvaT5cblx0XHRcdFx0XHQ8c3Bhbj57dGhpcy5wcm9wcy5tZXNzYWdlfTwvc3Bhbj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIEVycm9yTWVzc2FnZXMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZGVwbG95LWRyb3Bkb3duLWVycm9yc1wiPlxuXHRcdFx0XHR7dGhpcy5wcm9wcy5tZXNzYWdlfVxuXHRcdFx0PC9kaXY+XG5cdFx0KVxuXHR9XG59KTtcblxuLyoqXG4gKiBFbnZpcm9ubWVudE5hbWVcbiAqL1xudmFyIEVudmlyb25tZW50TmFtZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cImVudmlyb25tZW50LW5hbWVcIj5cblx0XHRcdFx0PGkgY2xhc3NOYW1lPVwiZmEgZmEtcm9ja2V0XCI+Jm5ic3A7PC9pPlxuXHRcdFx0XHREZXBsb3ltZW50IG9wdGlvbnMgPHNwYW4gY2xhc3NOYW1lPVwiaGlkZGVuLXhzXCI+Zm9yIHt0aGlzLnByb3BzLmVudmlyb25tZW50TmFtZX08L3NwYW4+XG5cdFx0XHQ8L3NwYW4+XG5cdFx0KTtcblx0fVxufSk7XG5cbi8qKlxuICogRGVwbG95Rm9ybVxuICovXG52YXIgRGVwbG95Rm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2VsZWN0ZWRUYWI6IDEsXG5cdFx0XHRkYXRhOiBbXSxcblx0XHRcdHByZXNlbGVjdFNoYTogbnVsbFxuXHRcdH07XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmdpdERhdGEoKTtcblx0fSxcblxuXHRnaXREYXRhOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRsb2FkaW5nOiB0cnVlXG5cdFx0fSk7XG5cdFx0USgkLmFqYXgoe1xuXHRcdFx0dHlwZTogXCJQT1NUXCIsXG5cdFx0XHRkYXRhVHlwZTogJ2pzb24nLFxuXHRcdFx0dXJsOiB0aGlzLnByb3BzLmNvbnRleHQuZ2l0UmV2aXNpb25zVXJsXG5cdFx0fSkpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdGxvYWRpbmc6IGZhbHNlLFxuXHRcdFx0XHRkYXRhOiBkYXRhLlRhYnMsXG5cdFx0XHRcdHNlbGVjdGVkVGFiOiBkYXRhLnByZXNlbGVjdF90YWIgPyBwYXJzZUludChkYXRhLnByZXNlbGVjdF90YWIpIDogMSxcblx0XHRcdFx0cHJlc2VsZWN0U2hhOiBkYXRhLnByZXNlbGVjdF9zaGFcblx0XHRcdH0pO1xuXHRcdFx0c2VsZi5wcm9wcy5sYXN0RmV0Y2hlZEhhbmRsZXIoZGF0YS5sYXN0X2ZldGNoZWQpO1xuXHRcdH0sIGZ1bmN0aW9uKGRhdGEpe1xuXHRcdFx0RXZlbnRzLnB1Ymxpc2goJ2Vycm9yJywgZGF0YSk7XG5cdFx0fSk7XG5cdH0sXG5cblx0c2VsZWN0SGFuZGxlcjogZnVuY3Rpb24oaWQpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtzZWxlY3RlZFRhYjogaWR9KTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0aWYodGhpcy5zdGF0ZS5sb2FkaW5nKSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQ8TG9hZGluZ0RlcGxveUZvcm0gbWVzc2FnZT1cIkxvYWRpbmcmaGVsbGlwO1wiIC8+XG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImRlcGxveS1mb3JtLW91dGVyIGNsZWFyZml4XCI+XG5cdFx0XHRcdDxmb3JtIGNsYXNzTmFtZT1cImZvcm0taW5saW5lIGRlcGxveS1mb3JtXCIgYWN0aW9uPVwiUE9TVFwiIGFjdGlvbj1cIiNcIj5cblx0XHRcdFx0XHQ8RGVwbG95VGFiU2VsZWN0b3IgZGF0YT17dGhpcy5zdGF0ZS5kYXRhfSBvblNlbGVjdD17dGhpcy5zZWxlY3RIYW5kbGVyfSBzZWxlY3RlZFRhYj17dGhpcy5zdGF0ZS5zZWxlY3RlZFRhYn0gLz5cblx0XHRcdFx0XHQ8RGVwbG95VGFicyBjb250ZXh0PXt0aGlzLnByb3BzLmNvbnRleHR9IGRhdGE9e3RoaXMuc3RhdGUuZGF0YX0gc2VsZWN0ZWRUYWI9e3RoaXMuc3RhdGUuc2VsZWN0ZWRUYWJ9XG5cdFx0XHRcdFx0XHRwcmVzZWxlY3RTaGE9e3RoaXMuc3RhdGUucHJlc2VsZWN0U2hhfSBTZWN1cml0eVRva2VuPXt0aGlzLnN0YXRlLlNlY3VyaXR5VG9rZW59IC8+XG5cdFx0XHRcdDwvZm9ybT5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG4vKipcbiAqIERlcGxveVRhYlNlbGVjdG9yXG4gKi9cbnZhciBEZXBsb3lUYWJTZWxlY3RvciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciBzZWxlY3RvcnMgPSB0aGlzLnByb3BzLmRhdGEubWFwKGZ1bmN0aW9uKHRhYikge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0PERlcGxveVRhYlNlbGVjdCBrZXk9e3RhYi5pZH0gdGFiPXt0YWJ9IG9uU2VsZWN0PXtzZWxmLnByb3BzLm9uU2VsZWN0fSBzZWxlY3RlZFRhYj17c2VsZi5wcm9wcy5zZWxlY3RlZFRhYn0gLz5cblx0XHRcdCk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIChcblx0XHRcdDx1bCBjbGFzc05hbWU9XCJTZWxlY3Rpb25Hcm91cCB0YWJiZWRzZWxlY3Rpb25ncm91cCBub2xhYmVsXCI+XG5cdFx0XHRcdHtzZWxlY3RvcnN9XG5cdFx0XHQ8L3VsPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG4vKipcbiAqIERlcGxveVRhYlNlbGVjdFxuICovXG52YXIgRGVwbG95VGFiU2VsZWN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRoYW5kbGVDbGljazogZnVuY3Rpb24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHR0aGlzLnByb3BzLm9uU2VsZWN0KHRoaXMucHJvcHMudGFiLmlkKVxuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgY2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG5cdFx0XHRcImFjdGl2ZVwiIDogKHRoaXMucHJvcHMuc2VsZWN0ZWRUYWIgPT0gdGhpcy5wcm9wcy50YWIuaWQpXG5cdFx0fSk7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxsaSBjbGFzc05hbWU9e2NsYXNzZXN9PlxuXHRcdFx0XHQ8YSBvbkNsaWNrPXt0aGlzLmhhbmRsZUNsaWNrfSBocmVmPXtcIiNkZXBsb3ktdGFiLVwiK3RoaXMucHJvcHMudGFiLmlkfSA+e3RoaXMucHJvcHMudGFiLm5hbWV9PC9hPlxuXHRcdFx0PC9saT5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG4vKipcbiAqIERlcGxveVRhYnNcbiAqL1xudmFyIERlcGxveVRhYnMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgdGFicyA9IHRoaXMucHJvcHMuZGF0YS5tYXAoZnVuY3Rpb24odGFiKSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQ8RGVwbG95VGFiIGNvbnRleHQ9e3NlbGYucHJvcHMuY29udGV4dH0ga2V5PXt0YWIuaWR9IHRhYj17dGFifSBzZWxlY3RlZFRhYj17c2VsZi5wcm9wcy5zZWxlY3RlZFRhYn1cblx0XHRcdFx0XHRwcmVzZWxlY3RTaGE9e3NlbGYucHJvcHMuc2VsZWN0ZWRUYWI9PXRhYi5pZCA/IHNlbGYucHJvcHMucHJlc2VsZWN0U2hhIDogbnVsbH1cblx0XHRcdFx0XHRTZWN1cml0eVRva2VuPXtzZWxmLnByb3BzLlNlY3VyaXR5VG9rZW59IC8+XG5cdFx0XHQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwidGFiLWNvbnRlbnRcIj5cblx0XHRcdFx0e3RhYnN9XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxuLyoqXG4gKiBEZXBsb3lUYWJcbiAqL1xudmFyIERlcGxveVRhYiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c3VtbWFyeTogdGhpcy5nZXRJbml0aWFsU3VtbWFyeVN0YXRlKCksXG5cdFx0XHRvcHRpb25zOiB7fSxcblx0XHRcdHNoYTogdGhpcy5wcm9wcy5wcmVzZWxlY3RTaGEgPyB0aGlzLnByb3BzLnByZXNlbGVjdFNoYSA6ICcnXG5cdFx0fTtcblx0fSxcblx0Z2V0SW5pdGlhbFN1bW1hcnlTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNoYW5nZXM6IHt9LFxuXHRcdFx0bWVzc2FnZXM6IFtdLFxuXHRcdFx0dmFsaWRhdGlvbkNvZGU6ICcnLFxuXHRcdFx0ZXN0aW1hdGVkVGltZTogbnVsbCxcblx0XHRcdGFjdGlvbkNvZGU6IG51bGwsXG5cdFx0XHRpbml0aWFsU3RhdGU6IHRydWVcblx0XHR9XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5zaGFDaG9zZW4oKSkge1xuXHRcdFx0dGhpcy5jaGFuZ2VTaGEodGhpcy5zdGF0ZS5zaGEpO1xuXHRcdH1cblx0fSxcblx0T3B0aW9uQ2hhbmdlSGFuZGxlcjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMuc3RhdGUub3B0aW9ucztcblx0XHRvcHRpb25zW2V2ZW50LnRhcmdldC5uYW1lXSA9IGV2ZW50LnRhcmdldC5jaGVja2VkO1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0b3B0aW9uczogb3B0aW9uc1xuXHRcdH0pO1xuXHR9LFxuXHRTSEFDaGFuZ2VIYW5kbGVyOiBmdW5jdGlvbihldmVudCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0c2hhOiBldmVudC50YXJnZXQudmFsdWVcblx0XHR9KTtcblx0fSxcblx0Y2hhbmdlU2hhOiBmdW5jdGlvbihzaGEpIHtcblxuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0c3VtbWFyeTogdGhpcy5nZXRJbml0aWFsU3VtbWFyeVN0YXRlKClcblx0XHR9KTtcblxuXHRcdEV2ZW50cy5wdWJsaXNoKCdjaGFuZ2VfbG9hZGluZycpO1xuXG5cdFx0dmFyIGJyYW5jaCA9IG51bGw7XG5cblx0XHRmb3IgKHZhciBpIGluIHRoaXMucHJvcHMudGFiLmZpZWxkX2RhdGEpIHtcblx0XHRcdGlmICh0aGlzLnByb3BzLnRhYi5maWVsZF9kYXRhW2ldLmlkID09PSBzaGEpIHtcblx0XHRcdFx0YnJhbmNoID0gdGhpcy5wcm9wcy50YWIuZmllbGRfZGF0YVtpXS5icmFuY2hfbmFtZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR2YXIgc3VtbWFyeURhdGEgPSB7XG5cdFx0XHRzaGE6IHNoYSxcblx0XHRcdGJyYW5jaDogYnJhbmNoLFxuXHRcdFx0U2VjdXJpdHlJRDogdGhpcy5wcm9wcy5TZWN1cml0eVRva2VuXG5cdFx0fTtcblx0XHQvLyBtZXJnZSB0aGUgJ2FkdmFuY2VkJyBvcHRpb25zIGlmIHRoZXkgYXJlIHNldFxuXHRcdGZvciAodmFyIGF0dHJuYW1lIGluIHRoaXMuc3RhdGUub3B0aW9ucykge1xuXHRcdFx0aWYodGhpcy5zdGF0ZS5vcHRpb25zLmhhc093blByb3BlcnR5KGF0dHJuYW1lKSkge1xuXHRcdFx0XHRzdW1tYXJ5RGF0YVthdHRybmFtZV0gPSB0aGlzLnN0YXRlLm9wdGlvbnNbYXR0cm5hbWVdO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRRKCQuYWpheCh7XG5cdFx0XHR0eXBlOiBcIlBPU1RcIixcblx0XHRcdGRhdGFUeXBlOiAnanNvbicsXG5cdFx0XHR1cmw6IHRoaXMucHJvcHMuY29udGV4dC5lbnZVcmwgKyAnL2RlcGxveV9zdW1tYXJ5Jyxcblx0XHRcdGRhdGE6IHN1bW1hcnlEYXRhXG5cdFx0fSkpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRcdHN1bW1hcnk6IGRhdGFcblx0XHRcdH0pO1xuXHRcdFx0RXZlbnRzLnB1Ymxpc2goJ2NoYW5nZV9sb2FkaW5nL2RvbmUnKTtcblx0XHR9LmJpbmQodGhpcyksIGZ1bmN0aW9uKCl7XG5cdFx0XHRFdmVudHMucHVibGlzaCgnY2hhbmdlX2xvYWRpbmcvZG9uZScpO1xuXHRcdH0pO1xuXHR9LFxuXG5cdGNoYW5nZUhhbmRsZXI6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRpZihldmVudC50YXJnZXQudmFsdWUgPT09IFwiXCIpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dmFyIHNoYSA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5zaGFfc2VsZWN0b3IucmVmcy5zaGEpLnZhbHVlO1xuXHRcdHJldHVybiB0aGlzLmNoYW5nZVNoYShzaGEpO1xuXHR9LFxuXG5cdHNob3dPcHRpb25zOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5wcm9wcy50YWIuYWR2YW5jZWRfb3B0cyA9PT0gJ3RydWUnO1xuXHR9LFxuXG5cdHNob3dWZXJpZnlCdXR0b246IGZ1bmN0aW9uKCkge1xuXHRcdGlmKHRoaXMuc2hvd09wdGlvbnMoKSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnByb3BzLnRhYi5maWVsZF90eXBlID09ICd0ZXh0ZmllbGQnO1xuXHR9LFxuXG5cdHNoYUNob3NlbjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICh0aGlzLnN0YXRlLnNoYSAhPT0gJycpO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBjbGFzc2VzID0gSGVscGVycy5jbGFzc05hbWVzKHtcblx0XHRcdFwidGFiLXBhbmVcIjogdHJ1ZSxcblx0XHRcdFwiY2xlYXJmaXhcIjogdHJ1ZSxcblx0XHRcdFwiYWN0aXZlXCIgOiAodGhpcy5wcm9wcy5zZWxlY3RlZFRhYiA9PSB0aGlzLnByb3BzLnRhYi5pZClcblx0XHR9KTtcblxuXHRcdC8vIHNldHVwIHRoZSBkcm9wZG93biBvciB0aGUgdGV4dCBpbnB1dCBmb3Igc2VsZWN0aW5nIGEgU0hBXG5cdFx0dmFyIHNlbGVjdG9yO1xuXHRcdGlmICh0aGlzLnByb3BzLnRhYi5maWVsZF90eXBlID09ICdkcm9wZG93bicpIHtcblx0XHRcdHZhciBjaGFuZ2VIYW5kbGVyID0gdGhpcy5jaGFuZ2VIYW5kbGVyO1xuXHRcdFx0aWYodGhpcy5zaG93VmVyaWZ5QnV0dG9uKCkpIHsgY2hhbmdlSGFuZGxlciA9IHRoaXMuU0hBQ2hhbmdlSGFuZGxlciB9XG5cdFx0XHRzZWxlY3RvciA9IDxTZWxlY3RvckRyb3Bkb3duIHJlZj1cInNoYV9zZWxlY3RvclwiIHRhYj17dGhpcy5wcm9wcy50YWJ9XG5cdFx0XHRcdGNoYW5nZUhhbmRsZXI9e2NoYW5nZUhhbmRsZXJ9IGRlZmF1bHRWYWx1ZT17dGhpcy5zdGF0ZS5zaGF9IC8+XG5cdFx0fSBlbHNlIGlmICh0aGlzLnByb3BzLnRhYi5maWVsZF90eXBlID09ICd0ZXh0ZmllbGQnKSB7XG5cdFx0XHRzZWxlY3RvciA9IDxTZWxlY3RvclRleHQgcmVmPVwic2hhX3NlbGVjdG9yXCIgdGFiPXt0aGlzLnByb3BzLnRhYn1cblx0XHRcdFx0Y2hhbmdlSGFuZGxlcj17dGhpcy5TSEFDaGFuZ2VIYW5kbGVyfSBkZWZhdWx0VmFsdWU9e3RoaXMuc3RhdGUuc2hhfSAvPlxuXHRcdH1cblxuXHRcdC8vICdBZHZhbmNlZCcgb3B0aW9uc1xuXHRcdHZhciBvcHRpb25zID0gbnVsbDtcblx0XHRpZih0aGlzLnNob3dPcHRpb25zKCkpIHtcblx0XHRcdG9wdGlvbnMgPSA8QWR2YW5jZWRPcHRpb25zIHRhYj17dGhpcy5wcm9wcy50YWJ9IGNoYW5nZUhhbmRsZXI9e3RoaXMuT3B0aW9uQ2hhbmdlSGFuZGxlcn0gLz5cblx0XHR9XG5cblx0XHQvLyAnVGhlIHZlcmlmeSBidXR0b24nXG5cdFx0dmFyIHZlcmlmeUJ1dHRvbiA9IG51bGw7XG5cdFx0aWYodGhpcy5zaG93VmVyaWZ5QnV0dG9uKCkpIHtcblx0XHRcdHZlcmlmeUJ1dHRvbiA9IDxWZXJpZnlCdXR0b24gZGlzYWJsZWQ9eyF0aGlzLnNoYUNob3NlbigpfSBjaGFuZ2VIYW5kbGVyPXt0aGlzLmNoYW5nZUhhbmRsZXJ9IC8+XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgaWQ9e1wiZGVwbG95LXRhYi1cIit0aGlzLnByb3BzLnRhYi5pZH0gY2xhc3NOYW1lPXtjbGFzc2VzfT5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZWN0aW9uXCI+XG5cdFx0XHRcdFx0PGRpdiBodG1sRm9yPXt0aGlzLnByb3BzLnRhYi5maWVsZF9pZH0gY2xhc3NOYW1lPVwiaGVhZGVyXCI+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJudW1iZXJDaXJjbGVcIj4xPC9zcGFuPiB7dGhpcy5wcm9wcy50YWIuZmllbGRfbGFiZWx9XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0e3NlbGVjdG9yfVxuXHRcdFx0XHRcdHtvcHRpb25zfVxuXHRcdFx0XHRcdHt2ZXJpZnlCdXR0b259XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8RGVwbG95UGxhbiBjb250ZXh0PXt0aGlzLnByb3BzLmNvbnRleHR9IHN1bW1hcnk9e3RoaXMuc3RhdGUuc3VtbWFyeX0gLz5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgU2VsZWN0b3JEcm9wZG93biA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdCQoUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLnNoYSkpLnNlbGVjdDIoe1xuXHRcdFx0Ly8gTG9hZCBkYXRhIGludG8gdGhlIHNlbGVjdDIuXG5cdFx0XHQvLyBUaGUgZm9ybWF0IHN1cHBvcnRzIG9wdGdyb3VwcywgYW5kIGxvb2tzIGxpa2UgdGhpczpcblx0XHRcdC8vIFt7dGV4dDogJ29wdGdyb3VwIHRleHQnLCBjaGlsZHJlbjogW3tpZDogJzxzaGE+JywgdGV4dDogJzxpbm5lciB0ZXh0Pid9XX1dXG5cdFx0XHRkYXRhOiB0aGlzLnByb3BzLnRhYi5maWVsZF9kYXRhLFxuXHRcdH0pLnZhbCh0aGlzLnByb3BzLmRlZmF1bHRWYWx1ZSk7XG5cblx0XHQvLyBUcmlnZ2VyIGhhbmRsZXIgb25seSBuZWVkZWQgaWYgdGhlcmUgaXMgbm8gZXhwbGljaXQgYnV0dG9uLlxuXHRcdGlmKHRoaXMucHJvcHMuY2hhbmdlSGFuZGxlcikge1xuXHRcdFx0JChSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuc2hhKSkuc2VsZWN0MigpLm9uKFwiY2hhbmdlXCIsIHRoaXMucHJvcHMuY2hhbmdlSGFuZGxlcik7XG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gRnJvbSBodHRwczovL3NlbGVjdDIuZ2l0aHViLmlvL2V4YW1wbGVzLmh0bWwgXCJUaGUgYmVzdCB3YXkgdG8gZW5zdXJlIHRoYXQgU2VsZWN0MiBpcyB1c2luZyBhIHBlcmNlbnQgYmFzZWRcblx0XHQvLyB3aWR0aCBpcyB0byBpbmxpbmUgdGhlIHN0eWxlIGRlY2xhcmF0aW9uIGludG8gdGhlIHRhZ1wiLlxuXHRcdHZhciBzdHlsZSA9IHt3aWR0aDogJzEwMCUnfTtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZpZWxkXCI+XG5cdFx0XHRcdFx0PHNlbGVjdFxuXHRcdFx0XHRcdFx0cmVmPVwic2hhXCJcblx0XHRcdFx0XHRcdGlkPXt0aGlzLnByb3BzLnRhYi5maWVsZF9pZH1cblx0XHRcdFx0XHRcdG5hbWU9XCJzaGFcIlxuXHRcdFx0XHRcdFx0Y2xhc3NOYW1lPVwiZHJvcGRvd25cIlxuXHRcdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMucHJvcHMuY2hhbmdlSGFuZGxlcn1cblx0XHRcdFx0XHRcdHN0eWxlPXtzdHlsZX0+XG5cdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiXCI+U2VsZWN0IHt0aGlzLnByb3BzLnRhYi5maWVsZF9pZH08L29wdGlvbj5cblx0XHRcdFx0XHQ8L3NlbGVjdD5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIFNlbGVjdG9yVGV4dCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4oXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZpZWxkXCI+XG5cdFx0XHRcdDxpbnB1dFxuXHRcdFx0XHRcdHR5cGU9XCJ0ZXh0XCJcblx0XHRcdFx0XHRyZWY9XCJzaGFcIlxuXHRcdFx0XHRcdGlkPXt0aGlzLnByb3BzLnRhYi5maWVsZF9pZH1cblx0XHRcdFx0XHRuYW1lPVwic2hhXCJcblx0XHRcdFx0XHRjbGFzc05hbWU9XCJ0ZXh0XCJcblx0XHRcdFx0XHRkZWZhdWx0VmFsdWU9e3RoaXMucHJvcHMuZGVmYXVsdFZhbHVlfVxuXHRcdFx0XHRcdG9uQ2hhbmdlPXt0aGlzLnByb3BzLmNoYW5nZUhhbmRsZXJ9XG5cdFx0XHRcdC8+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIFZlcmlmeUJ1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJcIj5cblx0XHRcdFx0PGJ1dHRvblxuXHRcdFx0XHRcdGRpc2FibGVkPXt0aGlzLnByb3BzLmRpc2FibGVkfVxuXHRcdFx0XHRcdHZhbHVlPVwiVmVyaWZ5IGRlcGxveW1lbnRcIlxuXHRcdFx0XHRcdGNsYXNzTmFtZT1cImJ0biBidG4tZGVmYXVsdFwiXG5cdFx0XHRcdFx0b25DbGljaz17dGhpcy5wcm9wcy5jaGFuZ2VIYW5kbGVyfT5cblx0XHRcdFx0XHRWZXJpZnkgZGVwbG95bWVudFxuXHRcdFx0XHQ8L2J1dHRvbj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgQWR2YW5jZWRPcHRpb25zID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJkZXBsb3ktb3B0aW9uc1wiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZpZWxkY2hlY2tib3hcIj5cblx0XHRcdFx0XHQ8bGFiZWw+XG5cdFx0XHRcdFx0XHQ8aW5wdXRcblx0XHRcdFx0XHRcdFx0dHlwZT1cImNoZWNrYm94XCJcblx0XHRcdFx0XHRcdFx0bmFtZT1cImZvcmNlX2Z1bGxcIlxuXHRcdFx0XHRcdFx0XHRvbkNoYW5nZT17dGhpcy5wcm9wcy5jaGFuZ2VIYW5kbGVyfVxuXHRcdFx0XHRcdFx0Lz5cblx0XHRcdFx0XHRcdEZvcmNlIGZ1bGwgZGVwbG95bWVudFxuXHRcdFx0XHRcdDwvbGFiZWw+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZpZWxkY2hlY2tib3hcIj5cblx0XHRcdFx0XHQ8bGFiZWw+XG5cdFx0XHRcdFx0XHQ8aW5wdXRcblx0XHRcdFx0XHRcdFx0dHlwZT1cImNoZWNrYm94XCJcblx0XHRcdFx0XHRcdFx0bmFtZT1cIm5vcm9sbGJhY2tcIlxuXHRcdFx0XHRcdFx0XHRvbkNoYW5nZT17dGhpcy5wcm9wcy5jaGFuZ2VIYW5kbGVyfVxuXHRcdFx0XHRcdFx0Lz5cblx0XHRcdFx0XHRcdE5vIHJvbGxiYWNrIG9uIGRlcGxveSBmYWlsdXJlXG5cdFx0XHRcdFx0PC9sYWJlbD5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEZXBsb3ltZW50RGlhbG9nO1xuIiwiLyoqXG4gKiBBIHNpbXBsZSBwdWIgc3ViIGV2ZW50IGhhbmRsZXIgZm9yIGludGVyY29tcG9uZW50IGNvbW11bmljYXRpb25cbiAqL1xudmFyIHRvcGljcyA9IHt9O1xudmFyIGhPUCA9IHRvcGljcy5oYXNPd25Qcm9wZXJ0eTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHN1YnNjcmliZTogZnVuY3Rpb24odG9waWMsIGxpc3RlbmVyKSB7XG5cdFx0Ly8gQ3JlYXRlIHRoZSB0b3BpYydzIG9iamVjdCBpZiBub3QgeWV0IGNyZWF0ZWRcblx0XHRpZighaE9QLmNhbGwodG9waWNzLCB0b3BpYykpIHRvcGljc1t0b3BpY10gPSBbXTtcblxuXHRcdC8vIEFkZCB0aGUgbGlzdGVuZXIgdG8gcXVldWVcblx0XHR2YXIgaW5kZXggPSB0b3BpY3NbdG9waWNdLnB1c2gobGlzdGVuZXIpIC0xO1xuXG5cdFx0Ly8gUHJvdmlkZSBoYW5kbGUgYmFjayBmb3IgcmVtb3ZhbCBvZiB0b3BpY1xuXHRcdHJldHVybiB7XG5cdFx0XHRyZW1vdmU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRkZWxldGUgdG9waWNzW3RvcGljXVtpbmRleF07XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRwdWJsaXNoOiBmdW5jdGlvbih0b3BpYywgaW5mbykge1xuXHRcdC8vIElmIHRoZSB0b3BpYyBkb2Vzbid0IGV4aXN0LCBvciB0aGVyZSdzIG5vIGxpc3RlbmVycyBpbiBxdWV1ZSwganVzdCBsZWF2ZVxuXHRcdGlmKCFoT1AuY2FsbCh0b3BpY3MsIHRvcGljKSkgcmV0dXJuO1xuXG5cdFx0Ly8gQ3ljbGUgdGhyb3VnaCB0b3BpY3MgcXVldWUsIGZpcmUhXG5cdFx0dG9waWNzW3RvcGljXS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdGl0ZW0oaW5mbyAhPSB1bmRlZmluZWQgPyBpbmZvIDoge30pO1xuXHRcdH0pO1xuXHR9XG59O1xuIiwiLyoqXG4gKiBIZWxwZXIgY2xhc3MgdG8gY29uY2F0aW5hdGUgc3RyaW5ncyBkZXBlZGluZyBvbiBhIHRydWUgb3IgZmFsc2UuXG4gKlxuICogRXhhbXBsZTpcbiAqIHZhciBjbGFzc2VzID0gSGVscGVycy5jbGFzc05hbWVzKHtcbiAqICAgICBcImRlcGxveS1kcm9wZG93blwiOiB0cnVlLFxuICogICAgIFwibG9hZGluZ1wiOiBmYWxzZSxcbiAqICAgICBcIm9wZW5cIjogdHJ1ZSxcbiAqIH0pO1xuICpcbiAqIHRoZW4gY2xhc3NlcyB3aWxsIGVxdWFsIFwiZGVwbG95LWRyb3Bkb3duIG9wZW5cIlxuICpcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRjbGFzc05hbWVzOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGNsYXNzZXMgPSAnJztcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGFyZyA9IGFyZ3VtZW50c1tpXTtcblx0XHRcdGlmICghYXJnKSBjb250aW51ZTtcblxuXHRcdFx0dmFyIGFyZ1R5cGUgPSB0eXBlb2YgYXJnO1xuXG5cdFx0XHRpZiAoJ3N0cmluZycgPT09IGFyZ1R5cGUgfHwgJ251bWJlcicgPT09IGFyZ1R5cGUpIHtcblx0XHRcdFx0Y2xhc3NlcyArPSAnICcgKyBhcmc7XG5cblx0XHRcdH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSB7XG5cdFx0XHRcdGNsYXNzZXMgKz0gJyAnICsgY2xhc3NOYW1lcy5hcHBseShudWxsLCBhcmcpO1xuXG5cdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09PSBhcmdUeXBlKSB7XG5cdFx0XHRcdGZvciAodmFyIGtleSBpbiBhcmcpIHtcblx0XHRcdFx0XHRpZiAoYXJnLmhhc093blByb3BlcnR5KGtleSkgJiYgYXJnW2tleV0pIHtcblx0XHRcdFx0XHRcdGNsYXNzZXMgKz0gJyAnICsga2V5O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gY2xhc3Nlcy5zdWJzdHIoMSk7XG5cdH1cbn1cbiIsInZhciBEZXBsb3ltZW50RGlhbG9nID0gcmVxdWlyZSgnLi9kZXBsb3ltZW50X2RpYWxvZy5qc3gnKTtcblxuLy8gTW91bnQgdGhlIGNvbXBvbmVudCBvbmx5IG9uIHRoZSBwYWdlIHdoZXJlIHRoZSBob2xkZXIgaXMgYWN0dWFsbHkgcHJlc2VudC5cbnZhciBob2xkZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZGVwbG95bWVudC1kaWFsb2ctaG9sZGVyJyk7XG5pZiAoaG9sZGVyKSB7XG5cdFJlYWN0LnJlbmRlcihcblx0XHQ8RGVwbG95bWVudERpYWxvZyBjb250ZXh0ID0ge2Vudmlyb25tZW50Q29uZmlnQ29udGV4dH0gLz4sXG5cdFx0aG9sZGVyXG5cdCk7XG59XG5cblxuIiwiXG4vKipcbiAqIEBqc3ggUmVhY3QuRE9NXG4gKi9cbnZhciBTdW1tYXJ5VGFibGUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGlzRW1wdHk6IGZ1bmN0aW9uKG9iaikge1xuXHRcdGZvciAodmFyIGtleSBpbiBvYmopIHtcblx0XHRcdGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSAmJiBvYmpba2V5XSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjaGFuZ2VzID0gdGhpcy5wcm9wcy5jaGFuZ2VzO1xuXHRcdGlmKHRoaXMuaXNFbXB0eShjaGFuZ2VzKSkge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHRcdHZhciBpZHggPSAwO1xuXHRcdHZhciBzdW1tYXJ5TGluZXMgPSBPYmplY3Qua2V5cyhjaGFuZ2VzKS5tYXAoZnVuY3Rpb24oa2V5KSB7XG5cdFx0XHRpZHgrKztcblxuXHRcdFx0dmFyIGNvbXBhcmVVcmwgPSBudWxsO1xuXHRcdFx0aWYodHlwZW9mIGNoYW5nZXNba2V5XS5jb21wYXJlVXJsICE9ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRcdGNvbXBhcmVVcmwgPSBjaGFuZ2VzW2tleV0uY29tcGFyZVVybDtcblx0XHRcdH1cblxuXHRcdFx0aWYodHlwZW9mIGNoYW5nZXNba2V5XS5kZXNjcmlwdGlvbiE9PSd1bmRlZmluZWQnKSB7XG5cblx0XHRcdFx0aWYgKGNoYW5nZXNba2V5XS5kZXNjcmlwdGlvbiE9PVwiXCIpIHtcblx0XHRcdFx0XHRyZXR1cm4gPERlc2NyaXB0aW9uT25seVN1bW1hcnlMaW5lIGtleT17aWR4fSBuYW1lPXtrZXl9IGRlc2NyaXB0aW9uPXtjaGFuZ2VzW2tleV0uZGVzY3JpcHRpb259IGNvbXBhcmVVcmw9e2NvbXBhcmVVcmx9IC8+XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIDxVbmNoYW5nZWRTdW1tYXJ5TGluZSBrZXk9e2lkeH0gbmFtZT17a2V5fSB2YWx1ZT1cIlwiIC8+XG5cdFx0XHRcdH1cblxuXHRcdFx0fSBlbHNlIGlmKGNoYW5nZXNba2V5XS5mcm9tICE9IGNoYW5nZXNba2V5XS50bykge1xuXHRcdFx0XHRyZXR1cm4gPFN1bW1hcnlMaW5lIGtleT17aWR4fSBuYW1lPXtrZXl9IGZyb209e2NoYW5nZXNba2V5XS5mcm9tfSB0bz17Y2hhbmdlc1trZXldLnRvfSBjb21wYXJlVXJsPXtjb21wYXJlVXJsfSAvPlxuXHRcdFx0fSBlbHNlIGlmKHR5cGVvZiBjaGFuZ2VzW2tleV0uZnJvbSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0cmV0dXJuIDxVbmNoYW5nZWRTdW1tYXJ5TGluZSBrZXk9e2lkeH0gbmFtZT17a2V5fSB2YWx1ZT17Y2hhbmdlc1trZXldLmZyb219IC8+XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PHRhYmxlIGNsYXNzTmFtZT1cInRhYmxlIHRhYmxlLXN0cmlwZWQgdGFibGUtaG92ZXJcIj5cblx0XHRcdFx0PHRib2R5PlxuXHRcdFx0XHRcdHtzdW1tYXJ5TGluZXN9XG5cdFx0XHRcdDwvdGJvZHk+XG5cdFx0XHQ8L3RhYmxlPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgU3VtbWFyeUxpbmUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGZyb20gPSB0aGlzLnByb3BzLmZyb20sXG5cdFx0XHR0byA9IHRoaXMucHJvcHMudG87XG5cblx0XHQvLyBuYWl2ZSBnaXQgc2hhIGRldGVjdGlvblxuXHRcdGlmKGZyb20gIT09IG51bGwgJiYgZnJvbS5sZW5ndGggPT09IDQwKSB7XG5cdFx0XHRmcm9tID0gZnJvbS5zdWJzdHJpbmcoMCw3KTtcblx0XHR9XG5cblx0XHQvLyBuYWl2ZSBnaXQgc2hhIGRldGVjdGlvblxuXHRcdGlmKHRvICE9PSBudWxsICYmIHRvLmxlbmd0aCA9PT0gNDApIHtcblx0XHRcdHRvID0gdG8uc3Vic3RyaW5nKDAsNyk7XG5cdFx0fVxuXG5cdFx0dmFyIGNvbXBhcmVVcmwgPSBudWxsO1xuXHRcdGlmKHRoaXMucHJvcHMuY29tcGFyZVVybCAhPT0gbnVsbCkge1xuXHRcdFx0Y29tcGFyZVVybCA9IDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9e3RoaXMucHJvcHMuY29tcGFyZVVybH0+VmlldyBkaWZmPC9hPlxuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8dHI+XG5cdFx0XHRcdDx0aCBzY29wZT1cInJvd1wiPnt0aGlzLnByb3BzLm5hbWV9PC90aD5cblx0XHRcdFx0PHRkPntmcm9tfTwvdGQ+XG5cdFx0XHRcdDx0ZD48c3BhbiBjbGFzc05hbWU9XCJnbHlwaGljb24gZ2x5cGhpY29uLWFycm93LXJpZ2h0XCIgLz48L3RkPlxuXHRcdFx0XHQ8dGQ+e3RvfTwvdGQ+XG5cdFx0XHRcdDx0ZCBjbGFzc05hbWU9XCJjaGFuZ2VBY3Rpb25cIj57Y29tcGFyZVVybH08L3RkPlxuXHRcdFx0PC90cj5cblx0XHQpXG5cdH1cbn0pO1xuXG52YXIgVW5jaGFuZ2VkU3VtbWFyeUxpbmUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGZyb20gPSB0aGlzLnByb3BzLnZhbHVlO1xuXHRcdC8vIG5haXZlIGdpdCBzaGEgZGV0ZWN0aW9uXG5cdFx0aWYoZnJvbSAhPT0gbnVsbCAmJiBmcm9tLmxlbmd0aCA9PT0gNDApIHtcblx0XHRcdGZyb20gPSBmcm9tLnN1YnN0cmluZygwLDcpO1xuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8dHI+XG5cdFx0XHRcdDx0aCBzY29wZT1cInJvd1wiPnt0aGlzLnByb3BzLm5hbWV9PC90aD5cblx0XHRcdFx0PHRkPntmcm9tfTwvdGQ+XG5cdFx0XHRcdDx0ZD4mbmJzcDs8L3RkPlxuXHRcdFx0XHQ8dGQ+PHNwYW4gY2xhc3NOYW1lPVwibGFiZWwgbGFiZWwtc3VjY2Vzc1wiPlVuY2hhbmdlZDwvc3Bhbj48L3RkPlxuXHRcdFx0XHQ8dGQ+Jm5ic3A7PC90ZD5cblx0XHRcdDwvdHI+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBEZXNjcmlwdGlvbk9ubHlTdW1tYXJ5TGluZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY29tcGFyZUNvbHVtbiA9IG51bGw7XG5cdFx0dmFyIGNvbFNwYW4gPSBcIjRcIjtcblx0XHRpZih0aGlzLnByb3BzLmNvbXBhcmVVcmwgIT09IG51bGwpIHtcblx0XHRcdGNvbXBhcmVDb2x1bW4gPSA8dGQgY2xhc3NOYW1lPVwiY2hhbmdlQWN0aW9uXCI+PGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj17dGhpcy5wcm9wcy5jb21wYXJlVXJsfT5WaWV3IGRpZmY8L2E+PC90ZD47XG5cdFx0XHRjb2xTcGFuID0gXCIzXCI7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDx0cj5cblx0XHRcdFx0PHRoIHNjb3BlPVwicm93XCI+e3RoaXMucHJvcHMubmFtZX08L3RoPlxuXHRcdFx0XHQ8dGQgY29sU3Bhbj17Y29sU3Bhbn0gZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3tfX2h0bWw6IHRoaXMucHJvcHMuZGVzY3JpcHRpb259fSAvPlxuXHRcdFx0XHR7Y29tcGFyZUNvbHVtbn1cblx0XHRcdDwvdHI+XG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3VtbWFyeVRhYmxlO1xuIl19
