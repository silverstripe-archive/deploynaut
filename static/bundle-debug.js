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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvc2hhcnZleS9TaXRlcy9wbGF0Zm9ybS1kYXNoYm9hcmQvZGVwbG95bmF1dC9qcy9kZXBsb3lfcGxhbi5qc3giLCIvVXNlcnMvc2hhcnZleS9TaXRlcy9wbGF0Zm9ybS1kYXNoYm9hcmQvZGVwbG95bmF1dC9qcy9kZXBsb3ltZW50X2RpYWxvZy5qc3giLCIvVXNlcnMvc2hhcnZleS9TaXRlcy9wbGF0Zm9ybS1kYXNoYm9hcmQvZGVwbG95bmF1dC9qcy9ldmVudHMuanMiLCIvVXNlcnMvc2hhcnZleS9TaXRlcy9wbGF0Zm9ybS1kYXNoYm9hcmQvZGVwbG95bmF1dC9qcy9oZWxwZXJzLmpzIiwiL1VzZXJzL3NoYXJ2ZXkvU2l0ZXMvcGxhdGZvcm0tZGFzaGJvYXJkL2RlcGxveW5hdXQvanMvcGxhdGZvcm0uanN4IiwiL1VzZXJzL3NoYXJ2ZXkvU2l0ZXMvcGxhdGZvcm0tZGFzaGJvYXJkL2RlcGxveW5hdXQvanMvc3VtbWFyeV90YWJsZS5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDcEMsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3RDLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDOztBQUVsRCxJQUFJLGdDQUFnQywwQkFBQTtDQUNuQyxVQUFVLEVBQUUsSUFBSTtDQUNoQixjQUFjLEVBQUUsSUFBSTtDQUNwQixlQUFlLEVBQUUsV0FBVztFQUMzQixPQUFPO0dBQ04sZUFBZSxFQUFFLEtBQUs7R0FDdEIsZUFBZSxFQUFFLEtBQUs7R0FDdEIsV0FBVyxFQUFFLEtBQUs7R0FDbEI7RUFDRDtDQUNELGlCQUFpQixFQUFFLFdBQVc7QUFDL0IsRUFBRSxJQUFJLElBQUksR0FB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QSxFQUFBLFdBQWEsQ0FBSyxDQUFBLENBQUM7R0FDaEgsT0FBTyxHQUFHLEdBQUcsQ0FBQztBQUNqQixHQUFHOztFQUVEO0dBQ0Msb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQTtJQUNILG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsS0FBQSxFQUFLLENBQUMsS0FBTSxDQUFBLEVBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFVLENBQUEsRUFBQTtJQUN0QyxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLE9BQUEsRUFBTyxDQUFFLE9BQU8sRUFBQyxDQUFDLHVCQUFBLEVBQXVCLENBQUUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUUsQ0FBQSxDQUFHLENBQUEsRUFBQTtJQUNsRixhQUFjO0dBQ1gsQ0FBQTtJQUNKO0VBQ0Y7QUFDRixDQUFDLENBQUMsQ0FBQzs7QUFFSCxNQUFNLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcbnZhciBIZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzLmpzJyk7XG52YXIgU3VtbWFyeVRhYmxlID0gcmVxdWlyZSgnLi9zdW1tYXJ5X3RhYmxlLmpzeCcpO1xuXG52YXIgRGVwbG95UGxhbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0bG9hZGluZ1N1YjogbnVsbCxcblx0bG9hZGluZ0RvbmVTdWI6IG51bGwsXG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGxvYWRpbmdfY2hhbmdlczogZmFsc2UsXG5cdFx0XHRkZXBsb3lfZGlzYWJsZWQ6IGZhbHNlLFxuXHRcdFx0ZGVwbG95SG92ZXI6IGZhbHNlXG5cdFx0fVxuXHR9LFxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdC8vIHJlZ2lzdGVyIHN1YnNjcmliZXJzXG5cdFx0dGhpcy5sb2FkaW5nU3ViID0gRXZlbnRzLnN1YnNjcmliZSgnY2hhbmdlX2xvYWRpbmcnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0bG9hZGluZ19jaGFuZ2VzOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0XHR0aGlzLmxvYWRpbmdEb25lU3ViID0gRXZlbnRzLnN1YnNjcmliZSgnY2hhbmdlX2xvYWRpbmcvZG9uZScsIGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0XHRsb2FkaW5nX2NoYW5nZXM6IGZhbHNlXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fSxcblx0ZGVwbG95SGFuZGxlcjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0ZGVwbG95X2Rpc2FibGVkOiB0cnVlXG5cdFx0fSk7XG5cblx0XHRRKCQuYWpheCh7XG5cdFx0XHR0eXBlOiBcIlBPU1RcIixcblx0XHRcdGRhdGFUeXBlOiAnanNvbicsXG5cdFx0XHR1cmw6IHRoaXMucHJvcHMuY29udGV4dC5lbnZVcmwgKyAnL3N0YXJ0LWRlcGxveScsXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdC8vIFBhc3MgdGhlIHN0cmF0ZWd5IG9iamVjdCB0aGUgdXNlciBoYXMganVzdCBzaWduZWQgb2ZmIGJhY2sgdG8gdGhlIGJhY2tlbmQuXG5cdFx0XHRcdCdzdHJhdGVneSc6IHRoaXMucHJvcHMuc3VtbWFyeSxcblx0XHRcdFx0J1NlY3VyaXR5SUQnOiB0aGlzLnByb3BzLnN1bW1hcnkuU2VjdXJpdHlJRFxuXHRcdFx0fVxuXHRcdH0pKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdHdpbmRvdy5sb2NhdGlvbiA9IGRhdGEudXJsO1xuXHRcdH0sIGZ1bmN0aW9uKGRhdGEpe1xuXHRcdFx0Y29uc29sZS5lcnJvcihkYXRhKTtcblx0XHR9KTtcblx0fSxcblx0bW91c2VFbnRlckhhbmRsZXI6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7ZGVwbG95SG92ZXI6IHRydWV9KTtcblx0fSxcblx0bW91c2VMZWF2ZUhhbmRsZXI6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7ZGVwbG95SG92ZXI6IGZhbHNlfSk7XG5cdH0sXG5cdGNhbkRlcGxveTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICh0aGlzLnByb3BzLnN1bW1hcnkudmFsaWRhdGlvbkNvZGU9PT1cInN1Y2Nlc3NcIiB8fCB0aGlzLnByb3BzLnN1bW1hcnkudmFsaWRhdGlvbkNvZGU9PT1cIndhcm5pbmdcIik7XG5cdH0sXG5cdGlzRW1wdHk6IGZ1bmN0aW9uKG9iaikge1xuXHRcdGZvciAodmFyIGtleSBpbiBvYmopIHtcblx0XHRcdGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSAmJiBvYmpba2V5XSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHR9LFxuXHRzaG93Tm9DaGFuZ2VzTWVzc2FnZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHN1bW1hcnkgPSB0aGlzLnByb3BzLnN1bW1hcnk7XG5cdFx0aWYoc3VtbWFyeS5pbml0aWFsU3RhdGUgPT09IHRydWUpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0aWYoc3VtbWFyeS5tZXNzYWdlcyA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gKHRoaXMuaXNFbXB0eShzdW1tYXJ5LmNoYW5nZXMpICYmIHN1bW1hcnkubWVzc2FnZXMubGVuZ3RoID09PSAwKTtcblx0fSxcblx0YWN0aW9uVGl0bGU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBhY3Rpb25UaXRsZSA9IHRoaXMucHJvcHMuc3VtbWFyeS5hY3Rpb25UaXRsZTtcblx0XHRpZiAodHlwZW9mIGFjdGlvblRpdGxlID09PSAndW5kZWZpbmVkJyB8fCBhY3Rpb25UaXRsZSA9PT0gJycgKSB7XG5cdFx0XHRyZXR1cm4gJ01ha2UgYSBzZWxlY3Rpb24nO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5wcm9wcy5zdW1tYXJ5LmFjdGlvblRpdGxlO1xuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBtZXNzYWdlcyA9IHRoaXMucHJvcHMuc3VtbWFyeS5tZXNzYWdlcztcblx0XHRpZiAodGhpcy5zaG93Tm9DaGFuZ2VzTWVzc2FnZSgpKSB7XG5cdFx0XHRtZXNzYWdlcyA9IFt7XG5cdFx0XHRcdHRleHQ6IFwiVGhlcmUgYXJlIG5vIGNoYW5nZXMgYnV0IHlvdSBjYW4gZGVwbG95IGFueXdheSBpZiB5b3Ugd2lzaC5cIixcblx0XHRcdFx0Y29kZTogXCJzdWNjZXNzXCJcblx0XHRcdH1dO1xuXHRcdH1cblxuXHRcdHZhciBkZXBsb3lBY3Rpb247XG5cdFx0aWYodGhpcy5jYW5EZXBsb3koKSkge1xuXHRcdFx0ZGVwbG95QWN0aW9uID0gKFxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlY3Rpb25cIlxuXHRcdFx0XHRcdG9uTW91c2VFbnRlcj17dGhpcy5tb3VzZUVudGVySGFuZGxlcn1cblx0XHRcdFx0XHRvbk1vdXNlTGVhdmU9e3RoaXMubW91c2VMZWF2ZUhhbmRsZXJ9PlxuXHRcdFx0XHRcdFx0PGJ1dHRvblxuXHRcdFx0XHRcdFx0XHR2YWx1ZT1cIkNvbmZpcm0gRGVwbG95bWVudFwiXG5cdFx0XHRcdFx0XHRcdGNsYXNzTmFtZT1cImRlcGxveSBwdWxsLWxlZnRcIlxuXHRcdFx0XHRcdFx0XHRkaXNhYmxlZD17dGhpcy5zdGF0ZS5kZXBsb3lfZGlzYWJsZWR9XG5cdFx0XHRcdFx0XHRcdG9uQ2xpY2s9e3RoaXMuZGVwbG95SGFuZGxlcn0+XG5cdFx0XHRcdFx0XHRcdHt0aGlzLmFjdGlvblRpdGxlKCl9XG5cdFx0XHRcdFx0XHQ8L2J1dHRvbj5cblx0XHRcdFx0XHRcdDxRdWlja1N1bW1hcnkgYWN0aXZhdGVkPXt0aGlzLnN0YXRlLmRlcGxveUhvdmVyfSBjb250ZXh0PXt0aGlzLnByb3BzLmNvbnRleHR9IHN1bW1hcnk9e3RoaXMucHJvcHMuc3VtbWFyeX0gLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHZhciBoZWFkZXJDbGFzc2VzID0gSGVscGVycy5jbGFzc05hbWVzKHtcblx0XHRcdGhlYWRlcjogdHJ1ZSxcblx0XHRcdGluYWN0aXZlOiAhdGhpcy5jYW5EZXBsb3koKSxcblx0XHRcdGxvYWRpbmc6IHRoaXMuc3RhdGUubG9hZGluZ19jaGFuZ2VzXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4oXG5cdFx0XHQ8ZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlY3Rpb25cIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT17aGVhZGVyQ2xhc3Nlc30+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJzdGF0dXMtaWNvblwiPjwvc3Bhbj5cblx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cIm51bWJlckNpcmNsZVwiPjI8L3NwYW4+IFJldmlldyBjaGFuZ2VzXG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PE1lc3NhZ2VMaXN0IG1lc3NhZ2VzPXttZXNzYWdlc30gLz5cblx0XHRcdFx0XHQ8U3VtbWFyeVRhYmxlIGNoYW5nZXM9e3RoaXMucHJvcHMuc3VtbWFyeS5jaGFuZ2VzfSAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0e2RlcGxveUFjdGlvbn1cblx0XHRcdDwvZGl2PlxuXHRcdClcblx0fVxufSk7XG5cbnZhciBRdWlja1N1bW1hcnkgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHR5cGUgPSAodGhpcy5wcm9wcy5zdW1tYXJ5LmFjdGlvbkNvZGU9PT0nZmFzdCcgPyAnY29kZS1vbmx5JyA6ICdmdWxsJyk7XG5cdFx0dmFyIGVzdGltYXRlID0gW107XG5cdFx0aWYgKHRoaXMucHJvcHMuc3VtbWFyeS5lc3RpbWF0ZWRUaW1lICYmIHRoaXMucHJvcHMuc3VtbWFyeS5lc3RpbWF0ZWRUaW1lPjApIHtcblx0XHRcdGVzdGltYXRlID0gW1xuXHRcdFx0XHQ8ZHQ+RHVyYXRpb246PC9kdD4sXG5cdFx0XHRcdDxkZD57dGhpcy5wcm9wcy5zdW1tYXJ5LmVzdGltYXRlZFRpbWV9IG1pbiBhcHByb3guPC9kZD5cblx0XHRcdF07XG5cdFx0fVxuXG5cdFx0dmFyIGRsQ2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG5cdFx0XHRhY3RpdmF0ZWQ6IHRoaXMucHJvcHMuYWN0aXZhdGVkLFxuXHRcdFx0J3F1aWNrLXN1bW1hcnknOiB0cnVlXG5cdFx0fSk7XG5cblx0XHR2YXIgbW9yZUluZm8gPSBudWxsO1xuXHRcdGlmICh0eXBlb2YgdGhpcy5wcm9wcy5jb250ZXh0LmRlcGxveUhlbHAhPT0ndW5kZWZpbmVkJyAmJiB0aGlzLnByb3BzLmNvbnRleHQuZGVwbG95SGVscCkge1xuXHRcdFx0bW9yZUluZm8gPSAoXG5cdFx0XHRcdDxhIHRhcmdldD1cIl9ibGFua1wiIGNsYXNzTmFtZT1cInNtYWxsXCIgaHJlZj17dGhpcy5wcm9wcy5jb250ZXh0LmRlcGxveUhlbHB9Pm1vcmUgaW5mbzwvYT5cblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMucHJvcHMuY29udGV4dC5zaXRlVXJsKSB7XG5cdFx0XHR2YXIgZW52ID0gPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj17dGhpcy5wcm9wcy5jb250ZXh0LnNpdGVVcmx9Pnt0aGlzLnByb3BzLmNvbnRleHQuZW52TmFtZX08L2E+O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YXIgZW52ID0gPHNwYW4+e3RoaXMucHJvcHMuY29udGV4dC5lbnZOYW1lfTwvc3Bhbj47XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkbCBjbGFzc05hbWU9e2RsQ2xhc3Nlc30+XG5cdFx0XHRcdDxkdD5FbnZpcm9ubWVudDo8L2R0PlxuXHRcdFx0XHQ8ZGQ+e2Vudn08L2RkPlxuXHRcdFx0XHQ8ZHQ+RGVwbG95IHR5cGU6PC9kdD5cblx0XHRcdFx0PGRkPnt0eXBlfSB7bW9yZUluZm99PC9kZD5cblx0XHRcdFx0e2VzdGltYXRlfVxuXHRcdFx0PC9kbD5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIE1lc3NhZ2VMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGlmKHRoaXMucHJvcHMubWVzc2FnZXMubGVuZ3RoIDwgMSkge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHRcdGlmKHR5cGVvZiB0aGlzLnByb3BzLm1lc3NhZ2VzID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHRcdHZhciBpZHggPSAwO1xuXHRcdHZhciBtZXNzYWdlcyA9IHRoaXMucHJvcHMubWVzc2FnZXMubWFwKGZ1bmN0aW9uKG1lc3NhZ2UpIHtcblx0XHRcdGlkeCsrO1xuXHRcdFx0cmV0dXJuIDxNZXNzYWdlIGtleT17aWR4fSBtZXNzYWdlPXttZXNzYWdlfSAvPlxuXHRcdH0pO1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2PlxuXHRcdFx0XHR7bWVzc2FnZXN9XG5cdFx0XHQ8L2Rpdj5cblx0XHQpXG5cdH1cbn0pO1xuXG52YXIgTWVzc2FnZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY2xhc3NNYXAgPSB7XG5cdFx0XHQnZXJyb3InOiAnYWxlcnQgYWxlcnQtZGFuZ2VyJyxcblx0XHRcdCd3YXJuaW5nJzogJ2FsZXJ0IGFsZXJ0LXdhcm5pbmcnLFxuXHRcdFx0J3N1Y2Nlc3MnOiAnYWxlcnQgYWxlcnQtaW5mbydcblx0XHR9O1xuXHRcdHZhciBjbGFzc25hbWU9Y2xhc3NNYXBbdGhpcy5wcm9wcy5tZXNzYWdlLmNvZGVdO1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT17Y2xhc3NuYW1lfSByb2xlPVwiYWxlcnRcIlxuXHRcdFx0XHRkYW5nZXJvdXNseVNldElubmVySFRNTD17e19faHRtbDogdGhpcy5wcm9wcy5tZXNzYWdlLnRleHR9fSAvPlxuXHRcdClcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRGVwbG95UGxhbjtcbiIsInZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cy5qcycpO1xudmFyIEhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMuanMnKTtcbnZhciBEZXBsb3lQbGFuID0gcmVxdWlyZSgnLi9kZXBsb3lfcGxhbi5qc3gnKTtcblxudmFyIERlcGxveW1lbnREaWFsb2cgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblx0bG9hZGluZ1N1YjogbnVsbCxcblxuXHRsb2FkaW5nRG9uZVN1YjogbnVsbCxcblxuXHRlcnJvclN1YjogbnVsbCxcblxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRsb2FkaW5nOiBmYWxzZSxcblx0XHRcdGxvYWRpbmdUZXh0OiBcIlwiLFxuXHRcdFx0ZXJyb3JUZXh0OiBcIlwiLFxuXHRcdFx0ZmV0Y2hlZDogdHJ1ZSxcblx0XHRcdGxhc3RfZmV0Y2hlZDogXCJcIlxuXHRcdH07XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0Ly8gYWRkIHN1YnNjcmliZXJzXG5cdFx0dGhpcy5sb2FkaW5nU3ViID0gRXZlbnRzLnN1YnNjcmliZSgnbG9hZGluZycsIGZ1bmN0aW9uKHRleHQpIHtcblx0XHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0XHRsb2FkaW5nOiB0cnVlLFxuXHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0bG9hZGluZ1RleHQ6IHRleHRcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdHRoaXMubG9hZGluZ0RvbmVTdWIgPSBFdmVudHMuc3Vic2NyaWJlKCdsb2FkaW5nL2RvbmUnLCBmdW5jdGlvbigpIHtcblx0XHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0XHRsb2FkaW5nOiBmYWxzZSxcblx0XHRcdFx0bG9hZGluZ1RleHQ6ICcnLFxuXHRcdFx0XHRzdWNjZXNzOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0XHR0aGlzLmVycm9yU3ViID0gRXZlbnRzLnN1YnNjcmliZSgnZXJyb3InLCBmdW5jdGlvbih0ZXh0KSB7XG5cdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0ZXJyb3JUZXh0OiB0ZXh0LFxuXHRcdFx0XHRsb2FkaW5nOiBmYWxzZSxcblx0XHRcdFx0bG9hZGluZ1RleHQ6ICcnLFxuXHRcdFx0XHRzdWNjZXNzOiBmYWxzZVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0sXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcblx0XHQvLyByZW1vdmUgc3Vic2NyaWJlcnNcblx0XHR0aGlzLmxvYWRpbmdTdWIucmVtb3ZlKCk7XG5cdFx0dGhpcy5sb2FkaW5nRG9uZVN1Yi5yZW1vdmUoKTtcblx0XHR0aGlzLmVycm9yU3ViLnJlbW92ZSgpO1xuXHR9LFxuXHRoYW5kbGVDbGljazogZnVuY3Rpb24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRFdmVudHMucHVibGlzaCgnbG9hZGluZycsIFwiRmV0Y2hpbmcgbGF0ZXN0IGNvZGXigKZcIik7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRmZXRjaGVkOiBmYWxzZVxuXHRcdH0pO1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRRKCQuYWpheCh7XG5cdFx0XHR0eXBlOiBcIlBPU1RcIixcblx0XHRcdGRhdGFUeXBlOiAnanNvbicsXG5cdFx0XHR1cmw6IHRoaXMucHJvcHMuY29udGV4dC5wcm9qZWN0VXJsICsgJy9mZXRjaCdcblx0XHR9KSlcblx0XHRcdC50aGVuKHRoaXMud2FpdEZvckZldGNoVG9Db21wbGV0ZSwgdGhpcy5mZXRjaFN0YXR1c0Vycm9yKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdEV2ZW50cy5wdWJsaXNoKCdsb2FkaW5nL2RvbmUnKTtcblx0XHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdFx0ZmV0Y2hlZDogdHJ1ZVxuXHRcdFx0XHR9KVxuXHRcdFx0fSkuY2F0Y2godGhpcy5mZXRjaFN0YXR1c0Vycm9yKS5kb25lKCk7XG5cdH0sXG5cdHdhaXRGb3JGZXRjaFRvQ29tcGxldGU6ZnVuY3Rpb24gKGZldGNoRGF0YSkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRyZXR1cm4gdGhpcy5nZXRGZXRjaFN0YXR1cyhmZXRjaERhdGEpLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcblx0XHRcdGlmIChkYXRhLnN0YXR1cyA9PT0gXCJDb21wbGV0ZVwiKSB7XG5cdFx0XHRcdHJldHVybiBkYXRhO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGRhdGEuc3RhdHVzID09PSBcIkZhaWxlZFwiKSB7XG5cdFx0XHRcdHJldHVybiAkLkRlZmVycmVkKGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGQucmVqZWN0KGRhdGEpO1xuXHRcdFx0XHR9KS5wcm9taXNlKCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gc2VsZi53YWl0Rm9yRmV0Y2hUb0NvbXBsZXRlKGZldGNoRGF0YSk7XG5cdFx0fSk7XG5cdH0sXG5cdGdldEZldGNoU3RhdHVzOiBmdW5jdGlvbiAoZmV0Y2hEYXRhKSB7XG5cdFx0cmV0dXJuIFEoJC5hamF4KHtcblx0XHRcdHR5cGU6IFwiR0VUXCIsXG5cdFx0XHR1cmw6IGZldGNoRGF0YS5ocmVmLFxuXHRcdFx0ZGF0YVR5cGU6ICdqc29uJ1xuXHRcdH0pKTtcblx0fSxcblx0ZmV0Y2hTdGF0dXNFcnJvcjogZnVuY3Rpb24oZGF0YSkge1xuXHRcdHZhciBtZXNzYWdlICA9ICdVbmtub3duIGVycm9yJztcblx0XHRpZih0eXBlb2YgZGF0YS5yZXNwb25zZVRleHQgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRtZXNzYWdlID0gZGF0YS5yZXNwb25zZVRleHQ7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgZGF0YS5tZXNzYWdlICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0bWVzc2FnZSA9IGRhdGEubWVzc2FnZTtcblx0XHR9XG5cdFx0RXZlbnRzLnB1Ymxpc2goJ2Vycm9yJywgbWVzc2FnZSk7XG5cdH0sXG5cdGxhc3RGZXRjaGVkSGFuZGxlcjogZnVuY3Rpb24odGltZV9hZ28pIHtcblx0XHR0aGlzLnNldFN0YXRlKHtsYXN0X2ZldGNoZWQ6IHRpbWVfYWdvfSk7XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNsYXNzZXMgPSBIZWxwZXJzLmNsYXNzTmFtZXMoe1xuXHRcdFx0XCJkZXBsb3ktZHJvcGRvd25cIjogdHJ1ZSxcblx0XHRcdFwibG9hZGluZ1wiOiB0aGlzLnN0YXRlLmxvYWRpbmcsXG5cdFx0XHRcInN1Y2Nlc3NcIjogdGhpcy5zdGF0ZS5zdWNjZXNzXG5cdFx0fSk7XG5cblx0XHR2YXIgZm9ybTtcblxuXHRcdGlmKHRoaXMuc3RhdGUuZXJyb3JUZXh0ICE9PSBcIlwiKSB7XG5cdFx0XHRmb3JtID0gPEVycm9yTWVzc2FnZXMgbWVzc2FnZT17dGhpcy5zdGF0ZS5lcnJvclRleHR9IC8+XG5cdFx0fSBlbHNlIGlmKHRoaXMuc3RhdGUuZmV0Y2hlZCkge1xuXHRcdFx0Zm9ybSA9IDxEZXBsb3lGb3JtIGNvbnRleHQ9e3RoaXMucHJvcHMuY29udGV4dH0gZGF0YT17dGhpcy5wcm9wcy5kYXRhfSBsYXN0RmV0Y2hlZEhhbmRsZXI9e3RoaXMubGFzdEZldGNoZWRIYW5kbGVyfSAvPlxuXHRcdH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5sb2FkaW5nKSB7XG5cdFx0XHRmb3JtID0gPExvYWRpbmdEZXBsb3lGb3JtIG1lc3NhZ2U9XCJGZXRjaGluZyBsYXRlc3QgY29kZSZoZWxsaXA7XCIgLz5cblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9e2NsYXNzZXN9IG9uQ2xpY2s9e3RoaXMuaGFuZGxlQ2xpY2t9PlxuXHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cInN0YXR1cy1pY29uXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPlxuXHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cInRpbWVcIj5sYXN0IHVwZGF0ZWQge3RoaXMuc3RhdGUubGFzdF9mZXRjaGVkfTwvc3Bhbj5cblx0XHRcdFx0XHQ8RW52aXJvbm1lbnROYW1lIGVudmlyb25tZW50TmFtZT17dGhpcy5wcm9wcy5jb250ZXh0LmVudk5hbWV9IC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHR7Zm9ybX1cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgTG9hZGluZ0RlcGxveUZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZGVwbG95LWZvcm0tbG9hZGluZ1wiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImljb24taG9sZGVyXCI+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPVwiZmEgZmEtY29nIGZhLXNwaW5cIj48L2k+XG5cdFx0XHRcdFx0PHNwYW4+e3RoaXMucHJvcHMubWVzc2FnZX08L3NwYW4+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBFcnJvck1lc3NhZ2VzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImRlcGxveS1kcm9wZG93bi1lcnJvcnNcIj5cblx0XHRcdFx0e3RoaXMucHJvcHMubWVzc2FnZX1cblx0XHRcdDwvZGl2PlxuXHRcdClcblx0fVxufSk7XG5cbi8qKlxuICogRW52aXJvbm1lbnROYW1lXG4gKi9cbnZhciBFbnZpcm9ubWVudE5hbWUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJlbnZpcm9ubWVudC1uYW1lXCI+XG5cdFx0XHRcdDxpIGNsYXNzTmFtZT1cImZhIGZhLXJvY2tldFwiPiZuYnNwOzwvaT5cblx0XHRcdFx0RGVwbG95bWVudCBvcHRpb25zIDxzcGFuIGNsYXNzTmFtZT1cImhpZGRlbi14c1wiPmZvciB7dGhpcy5wcm9wcy5lbnZpcm9ubWVudE5hbWV9PC9zcGFuPlxuXHRcdFx0PC9zcGFuPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG4vKipcbiAqIERlcGxveUZvcm1cbiAqL1xudmFyIERlcGxveUZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHNlbGVjdGVkVGFiOiAxLFxuXHRcdFx0ZGF0YTogW10sXG5cdFx0XHRwcmVzZWxlY3RTaGE6IG51bGxcblx0XHR9O1xuXHR9LFxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5naXREYXRhKCk7XG5cdH0sXG5cblx0Z2l0RGF0YTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0bG9hZGluZzogdHJ1ZVxuXHRcdH0pO1xuXHRcdFEoJC5hamF4KHtcblx0XHRcdHR5cGU6IFwiUE9TVFwiLFxuXHRcdFx0ZGF0YVR5cGU6ICdqc29uJyxcblx0XHRcdHVybDogdGhpcy5wcm9wcy5jb250ZXh0LmdpdFJldmlzaW9uc1VybFxuXHRcdH0pKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0XHRsb2FkaW5nOiBmYWxzZSxcblx0XHRcdFx0ZGF0YTogZGF0YS5UYWJzLFxuXHRcdFx0XHRzZWxlY3RlZFRhYjogZGF0YS5wcmVzZWxlY3RfdGFiID8gcGFyc2VJbnQoZGF0YS5wcmVzZWxlY3RfdGFiKSA6IDEsXG5cdFx0XHRcdHByZXNlbGVjdFNoYTogZGF0YS5wcmVzZWxlY3Rfc2hhXG5cdFx0XHR9KTtcblx0XHRcdHNlbGYucHJvcHMubGFzdEZldGNoZWRIYW5kbGVyKGRhdGEubGFzdF9mZXRjaGVkKTtcblx0XHR9LCBmdW5jdGlvbihkYXRhKXtcblx0XHRcdEV2ZW50cy5wdWJsaXNoKCdlcnJvcicsIGRhdGEpO1xuXHRcdH0pO1xuXHR9LFxuXG5cdHNlbGVjdEhhbmRsZXI6IGZ1bmN0aW9uKGlkKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRUYWI6IGlkfSk7XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdGlmKHRoaXMuc3RhdGUubG9hZGluZykge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0PExvYWRpbmdEZXBsb3lGb3JtIG1lc3NhZ2U9XCJMb2FkaW5nJmhlbGxpcDtcIiAvPlxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJkZXBsb3ktZm9ybS1vdXRlciBjbGVhcmZpeFwiPlxuXHRcdFx0XHQ8Zm9ybSBjbGFzc05hbWU9XCJmb3JtLWlubGluZSBkZXBsb3ktZm9ybVwiIGFjdGlvbj1cIlBPU1RcIiBhY3Rpb249XCIjXCI+XG5cdFx0XHRcdFx0PERlcGxveVRhYlNlbGVjdG9yIGRhdGE9e3RoaXMuc3RhdGUuZGF0YX0gb25TZWxlY3Q9e3RoaXMuc2VsZWN0SGFuZGxlcn0gc2VsZWN0ZWRUYWI9e3RoaXMuc3RhdGUuc2VsZWN0ZWRUYWJ9IC8+XG5cdFx0XHRcdFx0PERlcGxveVRhYnMgY29udGV4dD17dGhpcy5wcm9wcy5jb250ZXh0fSBkYXRhPXt0aGlzLnN0YXRlLmRhdGF9IHNlbGVjdGVkVGFiPXt0aGlzLnN0YXRlLnNlbGVjdGVkVGFifVxuXHRcdFx0XHRcdFx0cHJlc2VsZWN0U2hhPXt0aGlzLnN0YXRlLnByZXNlbGVjdFNoYX0gU2VjdXJpdHlUb2tlbj17dGhpcy5zdGF0ZS5TZWN1cml0eVRva2VufSAvPlxuXHRcdFx0XHQ8L2Zvcm0+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxuLyoqXG4gKiBEZXBsb3lUYWJTZWxlY3RvclxuICovXG52YXIgRGVwbG95VGFiU2VsZWN0b3IgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgc2VsZWN0b3JzID0gdGhpcy5wcm9wcy5kYXRhLm1hcChmdW5jdGlvbih0YWIpIHtcblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdDxEZXBsb3lUYWJTZWxlY3Qga2V5PXt0YWIuaWR9IHRhYj17dGFifSBvblNlbGVjdD17c2VsZi5wcm9wcy5vblNlbGVjdH0gc2VsZWN0ZWRUYWI9e3NlbGYucHJvcHMuc2VsZWN0ZWRUYWJ9IC8+XG5cdFx0XHQpO1xuXHRcdH0pO1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8dWwgY2xhc3NOYW1lPVwiU2VsZWN0aW9uR3JvdXAgdGFiYmVkc2VsZWN0aW9uZ3JvdXAgbm9sYWJlbFwiPlxuXHRcdFx0XHR7c2VsZWN0b3JzfVxuXHRcdFx0PC91bD5cblx0XHQpO1xuXHR9XG59KTtcblxuLyoqXG4gKiBEZXBsb3lUYWJTZWxlY3RcbiAqL1xudmFyIERlcGxveVRhYlNlbGVjdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0aGFuZGxlQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0dGhpcy5wcm9wcy5vblNlbGVjdCh0aGlzLnByb3BzLnRhYi5pZClcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGNsYXNzZXMgPSBIZWxwZXJzLmNsYXNzTmFtZXMoe1xuXHRcdFx0XCJhY3RpdmVcIiA6ICh0aGlzLnByb3BzLnNlbGVjdGVkVGFiID09IHRoaXMucHJvcHMudGFiLmlkKVxuXHRcdH0pO1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8bGkgY2xhc3NOYW1lPXtjbGFzc2VzfT5cblx0XHRcdFx0PGEgb25DbGljaz17dGhpcy5oYW5kbGVDbGlja30gaHJlZj17XCIjZGVwbG95LXRhYi1cIit0aGlzLnByb3BzLnRhYi5pZH0gPnt0aGlzLnByb3BzLnRhYi5uYW1lfTwvYT5cblx0XHRcdDwvbGk+XG5cdFx0KTtcblx0fVxuXG59KTtcblxuLyoqXG4gKiBEZXBsb3lUYWJzXG4gKi9cbnZhciBEZXBsb3lUYWJzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIHRhYnMgPSB0aGlzLnByb3BzLmRhdGEubWFwKGZ1bmN0aW9uKHRhYikge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0PERlcGxveVRhYiBjb250ZXh0PXtzZWxmLnByb3BzLmNvbnRleHR9IGtleT17dGFiLmlkfSB0YWI9e3RhYn0gc2VsZWN0ZWRUYWI9e3NlbGYucHJvcHMuc2VsZWN0ZWRUYWJ9XG5cdFx0XHRcdFx0cHJlc2VsZWN0U2hhPXtzZWxmLnByb3BzLnNlbGVjdGVkVGFiPT10YWIuaWQgPyBzZWxmLnByb3BzLnByZXNlbGVjdFNoYSA6IG51bGx9XG5cdFx0XHRcdFx0U2VjdXJpdHlUb2tlbj17c2VsZi5wcm9wcy5TZWN1cml0eVRva2VufSAvPlxuXHRcdFx0KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInRhYi1jb250ZW50XCI+XG5cdFx0XHRcdHt0YWJzfVxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbi8qKlxuICogRGVwbG95VGFiXG4gKi9cbnZhciBEZXBsb3lUYWIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHN1bW1hcnk6IHRoaXMuZ2V0SW5pdGlhbFN1bW1hcnlTdGF0ZSgpLFxuXHRcdFx0b3B0aW9uczoge30sXG5cdFx0XHRzaGE6IHRoaXMucHJvcHMucHJlc2VsZWN0U2hhID8gdGhpcy5wcm9wcy5wcmVzZWxlY3RTaGEgOiAnJ1xuXHRcdH07XG5cdH0sXG5cdGdldEluaXRpYWxTdW1tYXJ5U3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRjaGFuZ2VzOiB7fSxcblx0XHRcdG1lc3NhZ2VzOiBbXSxcblx0XHRcdHZhbGlkYXRpb25Db2RlOiAnJyxcblx0XHRcdGVzdGltYXRlZFRpbWU6IG51bGwsXG5cdFx0XHRhY3Rpb25Db2RlOiBudWxsLFxuXHRcdFx0aW5pdGlhbFN0YXRlOiB0cnVlXG5cdFx0fVxuXHR9LFxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMuc2hhQ2hvc2VuKCkpIHtcblx0XHRcdHRoaXMuY2hhbmdlU2hhKHRoaXMuc3RhdGUuc2hhKTtcblx0XHR9XG5cdH0sXG5cdE9wdGlvbkNoYW5nZUhhbmRsZXI6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIG9wdGlvbnMgPSB0aGlzLnN0YXRlLm9wdGlvbnM7XG5cdFx0b3B0aW9uc1tldmVudC50YXJnZXQubmFtZV0gPSBldmVudC50YXJnZXQuY2hlY2tlZDtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdG9wdGlvbnM6IG9wdGlvbnNcblx0XHR9KTtcblx0fSxcblx0U0hBQ2hhbmdlSGFuZGxlcjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdHNoYTogZXZlbnQudGFyZ2V0LnZhbHVlXG5cdFx0fSk7XG5cdH0sXG5cdGNoYW5nZVNoYTogZnVuY3Rpb24oc2hhKSB7XG5cblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdHN1bW1hcnk6IHRoaXMuZ2V0SW5pdGlhbFN1bW1hcnlTdGF0ZSgpXG5cdFx0fSk7XG5cblx0XHRFdmVudHMucHVibGlzaCgnY2hhbmdlX2xvYWRpbmcnKTtcblxuXHRcdHZhciBicmFuY2ggPSBudWxsO1xuXG5cdFx0Zm9yICh2YXIgaSBpbiB0aGlzLnByb3BzLnRhYi5maWVsZF9kYXRhKSB7XG5cdFx0XHRpZiAodGhpcy5wcm9wcy50YWIuZmllbGRfZGF0YVtpXS5pZCA9PT0gc2hhKSB7XG5cdFx0XHRcdGJyYW5jaCA9IHRoaXMucHJvcHMudGFiLmZpZWxkX2RhdGFbaV0uYnJhbmNoX25hbWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dmFyIHN1bW1hcnlEYXRhID0ge1xuXHRcdFx0c2hhOiBzaGEsXG5cdFx0XHRicmFuY2g6IGJyYW5jaCxcblx0XHRcdFNlY3VyaXR5SUQ6IHRoaXMucHJvcHMuU2VjdXJpdHlUb2tlblxuXHRcdH07XG5cdFx0Ly8gbWVyZ2UgdGhlICdhZHZhbmNlZCcgb3B0aW9ucyBpZiB0aGV5IGFyZSBzZXRcblx0XHRmb3IgKHZhciBhdHRybmFtZSBpbiB0aGlzLnN0YXRlLm9wdGlvbnMpIHtcblx0XHRcdGlmKHRoaXMuc3RhdGUub3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShhdHRybmFtZSkpIHtcblx0XHRcdFx0c3VtbWFyeURhdGFbYXR0cm5hbWVdID0gdGhpcy5zdGF0ZS5vcHRpb25zW2F0dHJuYW1lXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0USgkLmFqYXgoe1xuXHRcdFx0dHlwZTogXCJQT1NUXCIsXG5cdFx0XHRkYXRhVHlwZTogJ2pzb24nLFxuXHRcdFx0dXJsOiB0aGlzLnByb3BzLmNvbnRleHQuZW52VXJsICsgJy9kZXBsb3lfc3VtbWFyeScsXG5cdFx0XHRkYXRhOiBzdW1tYXJ5RGF0YVxuXHRcdH0pKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0XHRzdW1tYXJ5OiBkYXRhXG5cdFx0XHR9KTtcblx0XHRcdEV2ZW50cy5wdWJsaXNoKCdjaGFuZ2VfbG9hZGluZy9kb25lJyk7XG5cdFx0fS5iaW5kKHRoaXMpLCBmdW5jdGlvbigpe1xuXHRcdFx0RXZlbnRzLnB1Ymxpc2goJ2NoYW5nZV9sb2FkaW5nL2RvbmUnKTtcblx0XHR9KTtcblx0fSxcblxuXHRjaGFuZ2VIYW5kbGVyOiBmdW5jdGlvbihldmVudCkge1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0aWYoZXZlbnQudGFyZ2V0LnZhbHVlID09PSBcIlwiKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHZhciBzaGEgPSBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuc2hhX3NlbGVjdG9yLnJlZnMuc2hhKS52YWx1ZTtcblx0XHRyZXR1cm4gdGhpcy5jaGFuZ2VTaGEoc2hhKTtcblx0fSxcblxuXHRzaG93T3B0aW9uczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMucHJvcHMudGFiLmFkdmFuY2VkX29wdHMgPT09ICd0cnVlJztcblx0fSxcblxuXHRzaG93VmVyaWZ5QnV0dG9uOiBmdW5jdGlvbigpIHtcblx0XHRpZih0aGlzLnNob3dPcHRpb25zKCkpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5wcm9wcy50YWIuZmllbGRfdHlwZSA9PSAndGV4dGZpZWxkJztcblx0fSxcblxuXHRzaGFDaG9zZW46IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAodGhpcy5zdGF0ZS5zaGEgIT09ICcnKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgY2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG5cdFx0XHRcInRhYi1wYW5lXCI6IHRydWUsXG5cdFx0XHRcImNsZWFyZml4XCI6IHRydWUsXG5cdFx0XHRcImFjdGl2ZVwiIDogKHRoaXMucHJvcHMuc2VsZWN0ZWRUYWIgPT0gdGhpcy5wcm9wcy50YWIuaWQpXG5cdFx0fSk7XG5cblx0XHQvLyBzZXR1cCB0aGUgZHJvcGRvd24gb3IgdGhlIHRleHQgaW5wdXQgZm9yIHNlbGVjdGluZyBhIFNIQVxuXHRcdHZhciBzZWxlY3Rvcjtcblx0XHRpZiAodGhpcy5wcm9wcy50YWIuZmllbGRfdHlwZSA9PSAnZHJvcGRvd24nKSB7XG5cdFx0XHR2YXIgY2hhbmdlSGFuZGxlciA9IHRoaXMuY2hhbmdlSGFuZGxlcjtcblx0XHRcdGlmKHRoaXMuc2hvd1ZlcmlmeUJ1dHRvbigpKSB7IGNoYW5nZUhhbmRsZXIgPSB0aGlzLlNIQUNoYW5nZUhhbmRsZXIgfVxuXHRcdFx0c2VsZWN0b3IgPSA8U2VsZWN0b3JEcm9wZG93biByZWY9XCJzaGFfc2VsZWN0b3JcIiB0YWI9e3RoaXMucHJvcHMudGFifVxuXHRcdFx0XHRjaGFuZ2VIYW5kbGVyPXtjaGFuZ2VIYW5kbGVyfSBkZWZhdWx0VmFsdWU9e3RoaXMuc3RhdGUuc2hhfSAvPlxuXHRcdH0gZWxzZSBpZiAodGhpcy5wcm9wcy50YWIuZmllbGRfdHlwZSA9PSAndGV4dGZpZWxkJykge1xuXHRcdFx0c2VsZWN0b3IgPSA8U2VsZWN0b3JUZXh0IHJlZj1cInNoYV9zZWxlY3RvclwiIHRhYj17dGhpcy5wcm9wcy50YWJ9XG5cdFx0XHRcdGNoYW5nZUhhbmRsZXI9e3RoaXMuU0hBQ2hhbmdlSGFuZGxlcn0gZGVmYXVsdFZhbHVlPXt0aGlzLnN0YXRlLnNoYX0gLz5cblx0XHR9XG5cblx0XHQvLyAnQWR2YW5jZWQnIG9wdGlvbnNcblx0XHR2YXIgb3B0aW9ucyA9IG51bGw7XG5cdFx0aWYodGhpcy5zaG93T3B0aW9ucygpKSB7XG5cdFx0XHRvcHRpb25zID0gPEFkdmFuY2VkT3B0aW9ucyB0YWI9e3RoaXMucHJvcHMudGFifSBjaGFuZ2VIYW5kbGVyPXt0aGlzLk9wdGlvbkNoYW5nZUhhbmRsZXJ9IC8+XG5cdFx0fVxuXG5cdFx0Ly8gJ1RoZSB2ZXJpZnkgYnV0dG9uJ1xuXHRcdHZhciB2ZXJpZnlCdXR0b24gPSBudWxsO1xuXHRcdGlmKHRoaXMuc2hvd1ZlcmlmeUJ1dHRvbigpKSB7XG5cdFx0XHR2ZXJpZnlCdXR0b24gPSA8VmVyaWZ5QnV0dG9uIGRpc2FibGVkPXshdGhpcy5zaGFDaG9zZW4oKX0gY2hhbmdlSGFuZGxlcj17dGhpcy5jaGFuZ2VIYW5kbGVyfSAvPlxuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGlkPXtcImRlcGxveS10YWItXCIrdGhpcy5wcm9wcy50YWIuaWR9IGNsYXNzTmFtZT17Y2xhc3Nlc30+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VjdGlvblwiPlxuXHRcdFx0XHRcdDxkaXYgaHRtbEZvcj17dGhpcy5wcm9wcy50YWIuZmllbGRfaWR9IGNsYXNzTmFtZT1cImhlYWRlclwiPlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwibnVtYmVyQ2lyY2xlXCI+MTwvc3Bhbj4ge3RoaXMucHJvcHMudGFiLmZpZWxkX2xhYmVsfVxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdHtzZWxlY3Rvcn1cblx0XHRcdFx0XHR7b3B0aW9uc31cblx0XHRcdFx0XHR7dmVyaWZ5QnV0dG9ufVxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PERlcGxveVBsYW4gY29udGV4dD17dGhpcy5wcm9wcy5jb250ZXh0fSBzdW1tYXJ5PXt0aGlzLnN0YXRlLnN1bW1hcnl9IC8+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIFNlbGVjdG9yRHJvcGRvd24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHQkKFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5zaGEpKS5zZWxlY3QyKHtcblx0XHRcdC8vIExvYWQgZGF0YSBpbnRvIHRoZSBzZWxlY3QyLlxuXHRcdFx0Ly8gVGhlIGZvcm1hdCBzdXBwb3J0cyBvcHRncm91cHMsIGFuZCBsb29rcyBsaWtlIHRoaXM6XG5cdFx0XHQvLyBbe3RleHQ6ICdvcHRncm91cCB0ZXh0JywgY2hpbGRyZW46IFt7aWQ6ICc8c2hhPicsIHRleHQ6ICc8aW5uZXIgdGV4dD4nfV19XVxuXHRcdFx0ZGF0YTogdGhpcy5wcm9wcy50YWIuZmllbGRfZGF0YSxcblx0XHR9KS52YWwodGhpcy5wcm9wcy5kZWZhdWx0VmFsdWUpO1xuXG5cdFx0Ly8gVHJpZ2dlciBoYW5kbGVyIG9ubHkgbmVlZGVkIGlmIHRoZXJlIGlzIG5vIGV4cGxpY2l0IGJ1dHRvbi5cblx0XHRpZih0aGlzLnByb3BzLmNoYW5nZUhhbmRsZXIpIHtcblx0XHRcdCQoUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLnNoYSkpLnNlbGVjdDIoKS5vbihcImNoYW5nZVwiLCB0aGlzLnByb3BzLmNoYW5nZUhhbmRsZXIpO1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIEZyb20gaHR0cHM6Ly9zZWxlY3QyLmdpdGh1Yi5pby9leGFtcGxlcy5odG1sIFwiVGhlIGJlc3Qgd2F5IHRvIGVuc3VyZSB0aGF0IFNlbGVjdDIgaXMgdXNpbmcgYSBwZXJjZW50IGJhc2VkXG5cdFx0Ly8gd2lkdGggaXMgdG8gaW5saW5lIHRoZSBzdHlsZSBkZWNsYXJhdGlvbiBpbnRvIHRoZSB0YWdcIi5cblx0XHR2YXIgc3R5bGUgPSB7d2lkdGg6ICcxMDAlJ307XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmaWVsZFwiPlxuXHRcdFx0XHRcdDxzZWxlY3Rcblx0XHRcdFx0XHRcdHJlZj1cInNoYVwiXG5cdFx0XHRcdFx0XHRpZD17dGhpcy5wcm9wcy50YWIuZmllbGRfaWR9XG5cdFx0XHRcdFx0XHRuYW1lPVwic2hhXCJcblx0XHRcdFx0XHRcdGNsYXNzTmFtZT1cImRyb3Bkb3duXCJcblx0XHRcdFx0XHRcdG9uQ2hhbmdlPXt0aGlzLnByb3BzLmNoYW5nZUhhbmRsZXJ9XG5cdFx0XHRcdFx0XHRzdHlsZT17c3R5bGV9PlxuXHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIlwiPlNlbGVjdCB7dGhpcy5wcm9wcy50YWIuZmllbGRfaWR9PC9vcHRpb24+XG5cdFx0XHRcdFx0PC9zZWxlY3Q+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBTZWxlY3RvclRleHQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmaWVsZFwiPlxuXHRcdFx0XHQ8aW5wdXRcblx0XHRcdFx0XHR0eXBlPVwidGV4dFwiXG5cdFx0XHRcdFx0cmVmPVwic2hhXCJcblx0XHRcdFx0XHRpZD17dGhpcy5wcm9wcy50YWIuZmllbGRfaWR9XG5cdFx0XHRcdFx0bmFtZT1cInNoYVwiXG5cdFx0XHRcdFx0Y2xhc3NOYW1lPVwidGV4dFwiXG5cdFx0XHRcdFx0ZGVmYXVsdFZhbHVlPXt0aGlzLnByb3BzLmRlZmF1bHRWYWx1ZX1cblx0XHRcdFx0XHRvbkNoYW5nZT17dGhpcy5wcm9wcy5jaGFuZ2VIYW5kbGVyfVxuXHRcdFx0XHQvPlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBWZXJpZnlCdXR0b24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiXCI+XG5cdFx0XHRcdDxidXR0b25cblx0XHRcdFx0XHRkaXNhYmxlZD17dGhpcy5wcm9wcy5kaXNhYmxlZH1cblx0XHRcdFx0XHR2YWx1ZT1cIlZlcmlmeSBkZXBsb3ltZW50XCJcblx0XHRcdFx0XHRjbGFzc05hbWU9XCJidG4gYnRuLWRlZmF1bHRcIlxuXHRcdFx0XHRcdG9uQ2xpY2s9e3RoaXMucHJvcHMuY2hhbmdlSGFuZGxlcn0+XG5cdFx0XHRcdFx0VmVyaWZ5IGRlcGxveW1lbnRcblx0XHRcdFx0PC9idXR0b24+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIEFkdmFuY2VkT3B0aW9ucyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZGVwbG95LW9wdGlvbnNcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmaWVsZGNoZWNrYm94XCI+XG5cdFx0XHRcdFx0PGxhYmVsPlxuXHRcdFx0XHRcdFx0PGlucHV0XG5cdFx0XHRcdFx0XHRcdHR5cGU9XCJjaGVja2JveFwiXG5cdFx0XHRcdFx0XHRcdG5hbWU9XCJmb3JjZV9mdWxsXCJcblx0XHRcdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMucHJvcHMuY2hhbmdlSGFuZGxlcn1cblx0XHRcdFx0XHRcdC8+XG5cdFx0XHRcdFx0XHRGb3JjZSBmdWxsIGRlcGxveW1lbnRcblx0XHRcdFx0XHQ8L2xhYmVsPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmaWVsZGNoZWNrYm94XCI+XG5cdFx0XHRcdFx0PGxhYmVsPlxuXHRcdFx0XHRcdFx0PGlucHV0XG5cdFx0XHRcdFx0XHRcdHR5cGU9XCJjaGVja2JveFwiXG5cdFx0XHRcdFx0XHRcdG5hbWU9XCJub3JvbGxiYWNrXCJcblx0XHRcdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMucHJvcHMuY2hhbmdlSGFuZGxlcn1cblx0XHRcdFx0XHRcdC8+XG5cdFx0XHRcdFx0XHRObyByb2xsYmFjayBvbiBkZXBsb3kgZmFpbHVyZVxuXHRcdFx0XHRcdDwvbGFiZWw+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRGVwbG95bWVudERpYWxvZztcbiIsIi8qKlxuICogQSBzaW1wbGUgcHViIHN1YiBldmVudCBoYW5kbGVyIGZvciBpbnRlcmNvbXBvbmVudCBjb21tdW5pY2F0aW9uXG4gKi9cbnZhciB0b3BpY3MgPSB7fTtcbnZhciBoT1AgPSB0b3BpY3MuaGFzT3duUHJvcGVydHk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRzdWJzY3JpYmU6IGZ1bmN0aW9uKHRvcGljLCBsaXN0ZW5lcikge1xuXHRcdC8vIENyZWF0ZSB0aGUgdG9waWMncyBvYmplY3QgaWYgbm90IHlldCBjcmVhdGVkXG5cdFx0aWYoIWhPUC5jYWxsKHRvcGljcywgdG9waWMpKSB0b3BpY3NbdG9waWNdID0gW107XG5cblx0XHQvLyBBZGQgdGhlIGxpc3RlbmVyIHRvIHF1ZXVlXG5cdFx0dmFyIGluZGV4ID0gdG9waWNzW3RvcGljXS5wdXNoKGxpc3RlbmVyKSAtMTtcblxuXHRcdC8vIFByb3ZpZGUgaGFuZGxlIGJhY2sgZm9yIHJlbW92YWwgb2YgdG9waWNcblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVtb3ZlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0ZGVsZXRlIHRvcGljc1t0b3BpY11baW5kZXhdO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0cHVibGlzaDogZnVuY3Rpb24odG9waWMsIGluZm8pIHtcblx0XHQvLyBJZiB0aGUgdG9waWMgZG9lc24ndCBleGlzdCwgb3IgdGhlcmUncyBubyBsaXN0ZW5lcnMgaW4gcXVldWUsIGp1c3QgbGVhdmVcblx0XHRpZighaE9QLmNhbGwodG9waWNzLCB0b3BpYykpIHJldHVybjtcblxuXHRcdC8vIEN5Y2xlIHRocm91Z2ggdG9waWNzIHF1ZXVlLCBmaXJlIVxuXHRcdHRvcGljc1t0b3BpY10uZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRpdGVtKGluZm8gIT0gdW5kZWZpbmVkID8gaW5mbyA6IHt9KTtcblx0XHR9KTtcblx0fVxufTtcbiIsIi8qKlxuICogSGVscGVyIGNsYXNzIHRvIGNvbmNhdGluYXRlIHN0cmluZ3MgZGVwZWRpbmcgb24gYSB0cnVlIG9yIGZhbHNlLlxuICpcbiAqIEV4YW1wbGU6XG4gKiB2YXIgY2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG4gKiAgICAgXCJkZXBsb3ktZHJvcGRvd25cIjogdHJ1ZSxcbiAqICAgICBcImxvYWRpbmdcIjogZmFsc2UsXG4gKiAgICAgXCJvcGVuXCI6IHRydWUsXG4gKiB9KTtcbiAqXG4gKiB0aGVuIGNsYXNzZXMgd2lsbCBlcXVhbCBcImRlcGxveS1kcm9wZG93biBvcGVuXCJcbiAqXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Y2xhc3NOYW1lczogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBjbGFzc2VzID0gJyc7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBhcmcgPSBhcmd1bWVudHNbaV07XG5cdFx0XHRpZiAoIWFyZykgY29udGludWU7XG5cblx0XHRcdHZhciBhcmdUeXBlID0gdHlwZW9mIGFyZztcblxuXHRcdFx0aWYgKCdzdHJpbmcnID09PSBhcmdUeXBlIHx8ICdudW1iZXInID09PSBhcmdUeXBlKSB7XG5cdFx0XHRcdGNsYXNzZXMgKz0gJyAnICsgYXJnO1xuXG5cdFx0XHR9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuXHRcdFx0XHRjbGFzc2VzICs9ICcgJyArIGNsYXNzTmFtZXMuYXBwbHkobnVsbCwgYXJnKTtcblxuXHRcdFx0fSBlbHNlIGlmICgnb2JqZWN0JyA9PT0gYXJnVHlwZSkge1xuXHRcdFx0XHRmb3IgKHZhciBrZXkgaW4gYXJnKSB7XG5cdFx0XHRcdFx0aWYgKGFyZy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGFyZ1trZXldKSB7XG5cdFx0XHRcdFx0XHRjbGFzc2VzICs9ICcgJyArIGtleTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGNsYXNzZXMuc3Vic3RyKDEpO1xuXHR9XG59XG4iLCJ2YXIgRGVwbG95bWVudERpYWxvZyA9IHJlcXVpcmUoJy4vZGVwbG95bWVudF9kaWFsb2cuanN4Jyk7XG5cbi8vIE1vdW50IHRoZSBjb21wb25lbnQgb25seSBvbiB0aGUgcGFnZSB3aGVyZSB0aGUgaG9sZGVyIGlzIGFjdHVhbGx5IHByZXNlbnQuXG52YXIgaG9sZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlcGxveW1lbnQtZGlhbG9nLWhvbGRlcicpO1xuaWYgKGhvbGRlcikge1xuXHRSZWFjdC5yZW5kZXIoXG5cdFx0PERlcGxveW1lbnREaWFsb2cgY29udGV4dCA9IHtlbnZpcm9ubWVudENvbmZpZ0NvbnRleHR9IC8+LFxuXHRcdGhvbGRlclxuXHQpO1xufVxuXG5cbiIsIlxuLyoqXG4gKiBAanN4IFJlYWN0LkRPTVxuICovXG52YXIgU3VtbWFyeVRhYmxlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRpc0VtcHR5OiBmdW5jdGlvbihvYmopIHtcblx0XHRmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG5cdFx0XHRpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkgJiYgb2JqW2tleV0pIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY2hhbmdlcyA9IHRoaXMucHJvcHMuY2hhbmdlcztcblx0XHRpZih0aGlzLmlzRW1wdHkoY2hhbmdlcykpIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblx0XHR2YXIgaWR4ID0gMDtcblx0XHR2YXIgc3VtbWFyeUxpbmVzID0gT2JqZWN0LmtleXMoY2hhbmdlcykubWFwKGZ1bmN0aW9uKGtleSkge1xuXHRcdFx0aWR4Kys7XG5cblx0XHRcdHZhciBjb21wYXJlVXJsID0gbnVsbDtcblx0XHRcdGlmKHR5cGVvZiBjaGFuZ2VzW2tleV0uY29tcGFyZVVybCAhPSAndW5kZWZpbmVkJykge1xuXHRcdFx0XHRjb21wYXJlVXJsID0gY2hhbmdlc1trZXldLmNvbXBhcmVVcmw7XG5cdFx0XHR9XG5cblx0XHRcdGlmKHR5cGVvZiBjaGFuZ2VzW2tleV0uZGVzY3JpcHRpb24hPT0ndW5kZWZpbmVkJykge1xuXG5cdFx0XHRcdGlmIChjaGFuZ2VzW2tleV0uZGVzY3JpcHRpb24hPT1cIlwiKSB7XG5cdFx0XHRcdFx0cmV0dXJuIDxEZXNjcmlwdGlvbk9ubHlTdW1tYXJ5TGluZSBrZXk9e2lkeH0gbmFtZT17a2V5fSBkZXNjcmlwdGlvbj17Y2hhbmdlc1trZXldLmRlc2NyaXB0aW9ufSBjb21wYXJlVXJsPXtjb21wYXJlVXJsfSAvPlxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiA8VW5jaGFuZ2VkU3VtbWFyeUxpbmUga2V5PXtpZHh9IG5hbWU9e2tleX0gdmFsdWU9XCJcIiAvPlxuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSBpZihjaGFuZ2VzW2tleV0uZnJvbSAhPSBjaGFuZ2VzW2tleV0udG8pIHtcblx0XHRcdFx0cmV0dXJuIDxTdW1tYXJ5TGluZSBrZXk9e2lkeH0gbmFtZT17a2V5fSBmcm9tPXtjaGFuZ2VzW2tleV0uZnJvbX0gdG89e2NoYW5nZXNba2V5XS50b30gY29tcGFyZVVybD17Y29tcGFyZVVybH0gLz5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiA8VW5jaGFuZ2VkU3VtbWFyeUxpbmUga2V5PXtpZHh9IG5hbWU9e2tleX0gdmFsdWU9e2NoYW5nZXNba2V5XS5mcm9tfSAvPlxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdDx0YWJsZSBjbGFzc05hbWU9XCJ0YWJsZSB0YWJsZS1zdHJpcGVkIHRhYmxlLWhvdmVyXCI+XG5cdFx0XHRcdDx0Ym9keT5cblx0XHRcdFx0XHR7c3VtbWFyeUxpbmVzfVxuXHRcdFx0XHQ8L3Rib2R5PlxuXHRcdFx0PC90YWJsZT5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIFN1bW1hcnlMaW5lID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBmcm9tID0gdGhpcy5wcm9wcy5mcm9tLFxuXHRcdFx0dG8gPSB0aGlzLnByb3BzLnRvO1xuXG5cdFx0Ly8gbmFpdmUgZ2l0IHNoYSBkZXRlY3Rpb25cblx0XHRpZihmcm9tICE9PSBudWxsICYmIGZyb20ubGVuZ3RoID09PSA0MCkge1xuXHRcdFx0ZnJvbSA9IGZyb20uc3Vic3RyaW5nKDAsNyk7XG5cdFx0fVxuXG5cdFx0Ly8gbmFpdmUgZ2l0IHNoYSBkZXRlY3Rpb25cblx0XHRpZih0byAhPT0gbnVsbCAmJiB0by5sZW5ndGggPT09IDQwKSB7XG5cdFx0XHR0byA9IHRvLnN1YnN0cmluZygwLDcpO1xuXHRcdH1cblxuXHRcdHZhciBjb21wYXJlVXJsID0gbnVsbDtcblx0XHRpZih0aGlzLnByb3BzLmNvbXBhcmVVcmwgIT09IG51bGwpIHtcblx0XHRcdGNvbXBhcmVVcmwgPSA8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPXt0aGlzLnByb3BzLmNvbXBhcmVVcmx9PlZpZXcgZGlmZjwvYT5cblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PHRyPlxuXHRcdFx0XHQ8dGggc2NvcGU9XCJyb3dcIj57dGhpcy5wcm9wcy5uYW1lfTwvdGg+XG5cdFx0XHRcdDx0ZD57ZnJvbX08L3RkPlxuXHRcdFx0XHQ8dGQ+PHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1hcnJvdy1yaWdodFwiIC8+PC90ZD5cblx0XHRcdFx0PHRkPnt0b308L3RkPlxuXHRcdFx0XHQ8dGQgY2xhc3NOYW1lPVwiY2hhbmdlQWN0aW9uXCI+e2NvbXBhcmVVcmx9PC90ZD5cblx0XHRcdDwvdHI+XG5cdFx0KVxuXHR9XG59KTtcblxudmFyIFVuY2hhbmdlZFN1bW1hcnlMaW5lID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBmcm9tID0gdGhpcy5wcm9wcy52YWx1ZTtcblx0XHQvLyBuYWl2ZSBnaXQgc2hhIGRldGVjdGlvblxuXHRcdGlmKGZyb20gIT09IG51bGwgJiYgZnJvbS5sZW5ndGggPT09IDQwKSB7XG5cdFx0XHRmcm9tID0gZnJvbS5zdWJzdHJpbmcoMCw3KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PHRyPlxuXHRcdFx0XHQ8dGggc2NvcGU9XCJyb3dcIj57dGhpcy5wcm9wcy5uYW1lfTwvdGg+XG5cdFx0XHRcdDx0ZD57ZnJvbX08L3RkPlxuXHRcdFx0XHQ8dGQ+Jm5ic3A7PC90ZD5cblx0XHRcdFx0PHRkPjxzcGFuIGNsYXNzTmFtZT1cImxhYmVsIGxhYmVsLXN1Y2Nlc3NcIj5VbmNoYW5nZWQ8L3NwYW4+PC90ZD5cblx0XHRcdFx0PHRkPiZuYnNwOzwvdGQ+XG5cdFx0XHQ8L3RyPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgRGVzY3JpcHRpb25Pbmx5U3VtbWFyeUxpbmUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvbXBhcmVDb2x1bW4gPSBudWxsO1xuXHRcdHZhciBjb2xTcGFuID0gXCI0XCI7XG5cdFx0aWYodGhpcy5wcm9wcy5jb21wYXJlVXJsICE9PSBudWxsKSB7XG5cdFx0XHRjb21wYXJlQ29sdW1uID0gPHRkIGNsYXNzTmFtZT1cImNoYW5nZUFjdGlvblwiPjxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9e3RoaXMucHJvcHMuY29tcGFyZVVybH0+VmlldyBkaWZmPC9hPjwvdGQ+O1xuXHRcdFx0Y29sU3BhbiA9IFwiM1wiO1xuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8dHI+XG5cdFx0XHRcdDx0aCBzY29wZT1cInJvd1wiPnt0aGlzLnByb3BzLm5hbWV9PC90aD5cblx0XHRcdFx0PHRkIGNvbFNwYW49e2NvbFNwYW59IGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7X19odG1sOiB0aGlzLnByb3BzLmRlc2NyaXB0aW9ufX0gLz5cblx0XHRcdFx0e2NvbXBhcmVDb2x1bW59XG5cdFx0XHQ8L3RyPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN1bW1hcnlUYWJsZTtcbiJdfQ==
