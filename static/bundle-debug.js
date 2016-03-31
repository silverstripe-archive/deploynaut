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

		var sha = React.findDOMNode(this.refs.sha_selector.refs.sha).value;
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

},{}]},{},[5])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvc2hhcnZleS9TaXRlcy9wbGF0Zm9ybS1kYXNoYm9hcmQvZGVwbG95bmF1dC9qcy9kZXBsb3lfcGxhbi5qc3giLCIvVXNlcnMvc2hhcnZleS9TaXRlcy9wbGF0Zm9ybS1kYXNoYm9hcmQvZGVwbG95bmF1dC9qcy9kZXBsb3ltZW50X2RpYWxvZy5qc3giLCIvVXNlcnMvc2hhcnZleS9TaXRlcy9wbGF0Zm9ybS1kYXNoYm9hcmQvZGVwbG95bmF1dC9qcy9ldmVudHMuanMiLCIvVXNlcnMvc2hhcnZleS9TaXRlcy9wbGF0Zm9ybS1kYXNoYm9hcmQvZGVwbG95bmF1dC9qcy9oZWxwZXJzLmpzIiwiL1VzZXJzL3NoYXJ2ZXkvU2l0ZXMvcGxhdGZvcm0tZGFzaGJvYXJkL2RlcGxveW5hdXQvanMvcGxhdGZvcm0uanN4IiwiL1VzZXJzL3NoYXJ2ZXkvU2l0ZXMvcGxhdGZvcm0tZGFzaGJvYXJkL2RlcGxveW5hdXQvanMvc3VtbWFyeV90YWJsZS5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDcEMsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3RDLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDOztBQUVsRCxJQUFJLGdDQUFnQywwQkFBQTtDQUNuQyxVQUFVLEVBQUUsSUFBSTtDQUNoQixjQUFjLEVBQUUsSUFBSTtDQUNwQixlQUFlLEVBQUUsV0FBVztFQUMzQixPQUFPO0dBQ04sZUFBZSxFQUFFLEtBQUs7R0FDdEIsZUFBZSxFQUFFLEtBQUs7R0FDdEIsV0FBVyxFQUFFLEtBQUs7R0FDbEI7RUFDRDtDQUNELGlCQUFpQixFQUFFLFdBQVc7QUFDL0IsRUFBRSxJQUFJLElBQUksR0FB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T0FBQSxFQUFPLENBQUMsR0FBQSxFQUFHLENBQUMsdUJBQUEsRUFBdUIsQ0FBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBRSxDQUFBLENBQUcsQ0FBQTtHQUN6RSxDQUFBO0lBQ0o7RUFDRjtBQUNGLENBQUMsQ0FBQyxDQUFDOztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cy5qcycpO1xudmFyIEhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMuanMnKTtcbnZhciBTdW1tYXJ5VGFibGUgPSByZXF1aXJlKCcuL3N1bW1hcnlfdGFibGUuanN4Jyk7XG5cbnZhciBEZXBsb3lQbGFuID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRsb2FkaW5nU3ViOiBudWxsLFxuXHRsb2FkaW5nRG9uZVN1YjogbnVsbCxcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0bG9hZGluZ19jaGFuZ2VzOiBmYWxzZSxcblx0XHRcdGRlcGxveV9kaXNhYmxlZDogZmFsc2UsXG5cdFx0XHRkZXBsb3lIb3ZlcjogZmFsc2Vcblx0XHR9XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0Ly8gcmVnaXN0ZXIgc3Vic2NyaWJlcnNcblx0XHR0aGlzLmxvYWRpbmdTdWIgPSBFdmVudHMuc3Vic2NyaWJlKCdjaGFuZ2VfbG9hZGluZycsIGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0XHRsb2FkaW5nX2NoYW5nZXM6IHRydWVcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdHRoaXMubG9hZGluZ0RvbmVTdWIgPSBFdmVudHMuc3Vic2NyaWJlKCdjaGFuZ2VfbG9hZGluZy9kb25lJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdGxvYWRpbmdfY2hhbmdlczogZmFsc2Vcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9LFxuXHRkZXBsb3lIYW5kbGVyOiBmdW5jdGlvbihldmVudCkge1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRkZXBsb3lfZGlzYWJsZWQ6IHRydWVcblx0XHR9KTtcblxuXHRcdFEoJC5hamF4KHtcblx0XHRcdHR5cGU6IFwiUE9TVFwiLFxuXHRcdFx0ZGF0YVR5cGU6ICdqc29uJyxcblx0XHRcdHVybDogdGhpcy5wcm9wcy5jb250ZXh0LmVudlVybCArICcvc3RhcnQtZGVwbG95Jyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0Ly8gUGFzcyB0aGUgc3RyYXRlZ3kgb2JqZWN0IHRoZSB1c2VyIGhhcyBqdXN0IHNpZ25lZCBvZmYgYmFjayB0byB0aGUgYmFja2VuZC5cblx0XHRcdFx0J3N0cmF0ZWd5JzogdGhpcy5wcm9wcy5zdW1tYXJ5LFxuXHRcdFx0XHQnU2VjdXJpdHlJRCc6IHRoaXMucHJvcHMuc3VtbWFyeS5TZWN1cml0eUlEXG5cdFx0XHR9XG5cdFx0fSkpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0d2luZG93LmxvY2F0aW9uID0gZGF0YS51cmw7XG5cdFx0fSwgZnVuY3Rpb24oZGF0YSl7XG5cdFx0XHRjb25zb2xlLmVycm9yKGRhdGEpO1xuXHRcdH0pO1xuXHR9LFxuXHRtb3VzZUVudGVySGFuZGxlcjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtkZXBsb3lIb3ZlcjogdHJ1ZX0pO1xuXHR9LFxuXHRtb3VzZUxlYXZlSGFuZGxlcjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtkZXBsb3lIb3ZlcjogZmFsc2V9KTtcblx0fSxcblx0Y2FuRGVwbG95OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKHRoaXMucHJvcHMuc3VtbWFyeS52YWxpZGF0aW9uQ29kZT09PVwic3VjY2Vzc1wiIHx8IHRoaXMucHJvcHMuc3VtbWFyeS52YWxpZGF0aW9uQ29kZT09PVwid2FybmluZ1wiKTtcblx0fSxcblx0aXNFbXB0eTogZnVuY3Rpb24ob2JqKSB7XG5cdFx0Zm9yICh2YXIga2V5IGluIG9iaikge1xuXHRcdFx0aWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIG9ialtrZXldKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHRydWU7XG5cdH0sXG5cdHNob3dOb0NoYW5nZXNNZXNzYWdlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc3VtbWFyeSA9IHRoaXMucHJvcHMuc3VtbWFyeTtcblx0XHRpZihzdW1tYXJ5LmluaXRpYWxTdGF0ZSA9PT0gdHJ1ZSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRpZihzdW1tYXJ5Lm1lc3NhZ2VzID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiAodGhpcy5pc0VtcHR5KHN1bW1hcnkuY2hhbmdlcykgJiYgc3VtbWFyeS5tZXNzYWdlcy5sZW5ndGggPT09IDApO1xuXHR9LFxuXHRhY3Rpb25UaXRsZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGFjdGlvblRpdGxlID0gdGhpcy5wcm9wcy5zdW1tYXJ5LmFjdGlvblRpdGxlO1xuXHRcdGlmICh0eXBlb2YgYWN0aW9uVGl0bGUgPT09ICd1bmRlZmluZWQnIHx8IGFjdGlvblRpdGxlID09PSAnJyApIHtcblx0XHRcdHJldHVybiAnTWFrZSBhIHNlbGVjdGlvbic7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnByb3BzLnN1bW1hcnkuYWN0aW9uVGl0bGU7XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG1lc3NhZ2VzID0gdGhpcy5wcm9wcy5zdW1tYXJ5Lm1lc3NhZ2VzO1xuXHRcdGlmICh0aGlzLnNob3dOb0NoYW5nZXNNZXNzYWdlKCkpIHtcblx0XHRcdG1lc3NhZ2VzID0gW3tcblx0XHRcdFx0dGV4dDogXCJUaGVyZSBhcmUgbm8gY2hhbmdlcyBidXQgeW91IGNhbiBkZXBsb3kgYW55d2F5IGlmIHlvdSB3aXNoLlwiLFxuXHRcdFx0XHRjb2RlOiBcInN1Y2Nlc3NcIlxuXHRcdFx0fV07XG5cdFx0fVxuXG5cdFx0dmFyIGRlcGxveUFjdGlvbjtcblx0XHRpZih0aGlzLmNhbkRlcGxveSgpKSB7XG5cdFx0XHRkZXBsb3lBY3Rpb24gPSAoXG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VjdGlvblwiXG5cdFx0XHRcdFx0b25Nb3VzZUVudGVyPXt0aGlzLm1vdXNlRW50ZXJIYW5kbGVyfVxuXHRcdFx0XHRcdG9uTW91c2VMZWF2ZT17dGhpcy5tb3VzZUxlYXZlSGFuZGxlcn0+XG5cdFx0XHRcdFx0XHQ8YnV0dG9uXG5cdFx0XHRcdFx0XHRcdHZhbHVlPVwiQ29uZmlybSBEZXBsb3ltZW50XCJcblx0XHRcdFx0XHRcdFx0Y2xhc3NOYW1lPVwiZGVwbG95IHB1bGwtbGVmdFwiXG5cdFx0XHRcdFx0XHRcdGRpc2FibGVkPXt0aGlzLnN0YXRlLmRlcGxveV9kaXNhYmxlZH1cblx0XHRcdFx0XHRcdFx0b25DbGljaz17dGhpcy5kZXBsb3lIYW5kbGVyfT5cblx0XHRcdFx0XHRcdFx0e3RoaXMuYWN0aW9uVGl0bGUoKX1cblx0XHRcdFx0XHRcdDwvYnV0dG9uPlxuXHRcdFx0XHRcdFx0PFF1aWNrU3VtbWFyeSBhY3RpdmF0ZWQ9e3RoaXMuc3RhdGUuZGVwbG95SG92ZXJ9IGNvbnRleHQ9e3RoaXMucHJvcHMuY29udGV4dH0gc3VtbWFyeT17dGhpcy5wcm9wcy5zdW1tYXJ5fSAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0dmFyIGhlYWRlckNsYXNzZXMgPSBIZWxwZXJzLmNsYXNzTmFtZXMoe1xuXHRcdFx0aGVhZGVyOiB0cnVlLFxuXHRcdFx0aW5hY3RpdmU6ICF0aGlzLmNhbkRlcGxveSgpLFxuXHRcdFx0bG9hZGluZzogdGhpcy5zdGF0ZS5sb2FkaW5nX2NoYW5nZXNcblx0XHR9KTtcblxuXHRcdHJldHVybihcblx0XHRcdDxkaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VjdGlvblwiPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPXtoZWFkZXJDbGFzc2VzfT5cblx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cInN0YXR1cy1pY29uXCI+PC9zcGFuPlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwibnVtYmVyQ2lyY2xlXCI+Mjwvc3Bhbj4gUmV2aWV3IGNoYW5nZXNcblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8TWVzc2FnZUxpc3QgbWVzc2FnZXM9e21lc3NhZ2VzfSAvPlxuXHRcdFx0XHRcdDxTdW1tYXJ5VGFibGUgY2hhbmdlcz17dGhpcy5wcm9wcy5zdW1tYXJ5LmNoYW5nZXN9IC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHR7ZGVwbG95QWN0aW9ufVxuXHRcdFx0PC9kaXY+XG5cdFx0KVxuXHR9XG59KTtcblxudmFyIFF1aWNrU3VtbWFyeSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdHlwZSA9ICh0aGlzLnByb3BzLnN1bW1hcnkuYWN0aW9uQ29kZT09PSdmYXN0JyA/ICdjb2RlLW9ubHknIDogJ2Z1bGwnKTtcblx0XHR2YXIgZXN0aW1hdGUgPSBbXTtcblx0XHRpZiAodGhpcy5wcm9wcy5zdW1tYXJ5LmVzdGltYXRlZFRpbWUgJiYgdGhpcy5wcm9wcy5zdW1tYXJ5LmVzdGltYXRlZFRpbWU+MCkge1xuXHRcdFx0ZXN0aW1hdGUgPSBbXG5cdFx0XHRcdDxkdD5EdXJhdGlvbjo8L2R0Pixcblx0XHRcdFx0PGRkPnt0aGlzLnByb3BzLnN1bW1hcnkuZXN0aW1hdGVkVGltZX0gbWluIGFwcHJveC48L2RkPlxuXHRcdFx0XTtcblx0XHR9XG5cblx0XHR2YXIgZGxDbGFzc2VzID0gSGVscGVycy5jbGFzc05hbWVzKHtcblx0XHRcdGFjdGl2YXRlZDogdGhpcy5wcm9wcy5hY3RpdmF0ZWQsXG5cdFx0XHQncXVpY2stc3VtbWFyeSc6IHRydWVcblx0XHR9KTtcblxuXHRcdHZhciBtb3JlSW5mbyA9IG51bGw7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLnByb3BzLmNvbnRleHQuZGVwbG95SGVscCE9PSd1bmRlZmluZWQnICYmIHRoaXMucHJvcHMuY29udGV4dC5kZXBsb3lIZWxwKSB7XG5cdFx0XHRtb3JlSW5mbyA9IChcblx0XHRcdFx0PGEgdGFyZ2V0PVwiX2JsYW5rXCIgY2xhc3NOYW1lPVwic21hbGxcIiBocmVmPXt0aGlzLnByb3BzLmNvbnRleHQuZGVwbG95SGVscH0+bW9yZSBpbmZvPC9hPlxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5wcm9wcy5jb250ZXh0LnNpdGVVcmwpIHtcblx0XHRcdHZhciBlbnYgPSA8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPXt0aGlzLnByb3BzLmNvbnRleHQuc2l0ZVVybH0+e3RoaXMucHJvcHMuY29udGV4dC5lbnZOYW1lfTwvYT47XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBlbnYgPSA8c3Bhbj57dGhpcy5wcm9wcy5jb250ZXh0LmVudk5hbWV9PC9zcGFuPjtcblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRsIGNsYXNzTmFtZT17ZGxDbGFzc2VzfT5cblx0XHRcdFx0PGR0PkVudmlyb25tZW50OjwvZHQ+XG5cdFx0XHRcdDxkZD57ZW52fTwvZGQ+XG5cdFx0XHRcdDxkdD5EZXBsb3kgdHlwZTo8L2R0PlxuXHRcdFx0XHQ8ZGQ+e3R5cGV9IHttb3JlSW5mb308L2RkPlxuXHRcdFx0XHR7ZXN0aW1hdGV9XG5cdFx0XHQ8L2RsPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgTWVzc2FnZUxpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYodGhpcy5wcm9wcy5tZXNzYWdlcy5sZW5ndGggPCAxKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdFx0aWYodHlwZW9mIHRoaXMucHJvcHMubWVzc2FnZXMgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdFx0dmFyIGlkeCA9IDA7XG5cdFx0dmFyIG1lc3NhZ2VzID0gdGhpcy5wcm9wcy5tZXNzYWdlcy5tYXAoZnVuY3Rpb24obWVzc2FnZSkge1xuXHRcdFx0aWR4Kys7XG5cdFx0XHRyZXR1cm4gPE1lc3NhZ2Uga2V5PXtpZHh9IG1lc3NhZ2U9e21lc3NhZ2V9IC8+XG5cdFx0fSk7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXY+XG5cdFx0XHRcdHttZXNzYWdlc31cblx0XHRcdDwvZGl2PlxuXHRcdClcblx0fVxufSk7XG5cbnZhciBNZXNzYWdlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjbGFzc01hcCA9IHtcblx0XHRcdCdlcnJvcic6ICdhbGVydCBhbGVydC1kYW5nZXInLFxuXHRcdFx0J3dhcm5pbmcnOiAnYWxlcnQgYWxlcnQtd2FybmluZycsXG5cdFx0XHQnc3VjY2Vzcyc6ICdhbGVydCBhbGVydC1pbmZvJ1xuXHRcdH07XG5cdFx0dmFyIGNsYXNzbmFtZT1jbGFzc01hcFt0aGlzLnByb3BzLm1lc3NhZ2UuY29kZV07XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPXtjbGFzc25hbWV9IHJvbGU9XCJhbGVydFwiXG5cdFx0XHRcdGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7X19odG1sOiB0aGlzLnByb3BzLm1lc3NhZ2UudGV4dH19IC8+XG5cdFx0KVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEZXBsb3lQbGFuO1xuIiwidmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XG52YXIgSGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycy5qcycpO1xudmFyIERlcGxveVBsYW4gPSByZXF1aXJlKCcuL2RlcGxveV9wbGFuLmpzeCcpO1xuXG52YXIgRGVwbG95bWVudERpYWxvZyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuXHRsb2FkaW5nU3ViOiBudWxsLFxuXG5cdGxvYWRpbmdEb25lU3ViOiBudWxsLFxuXG5cdGVycm9yU3ViOiBudWxsLFxuXG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGxvYWRpbmc6IGZhbHNlLFxuXHRcdFx0bG9hZGluZ1RleHQ6IFwiXCIsXG5cdFx0XHRlcnJvclRleHQ6IFwiXCIsXG5cdFx0XHRmZXRjaGVkOiB0cnVlLFxuXHRcdFx0bGFzdF9mZXRjaGVkOiBcIlwiXG5cdFx0fTtcblx0fSxcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHQvLyBhZGQgc3Vic2NyaWJlcnNcblx0XHR0aGlzLmxvYWRpbmdTdWIgPSBFdmVudHMuc3Vic2NyaWJlKCdsb2FkaW5nJywgZnVuY3Rpb24odGV4dCkge1xuXHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdGxvYWRpbmc6IHRydWUsXG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRsb2FkaW5nVGV4dDogdGV4dFxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdFx0dGhpcy5sb2FkaW5nRG9uZVN1YiA9IEV2ZW50cy5zdWJzY3JpYmUoJ2xvYWRpbmcvZG9uZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdGxvYWRpbmc6IGZhbHNlLFxuXHRcdFx0XHRsb2FkaW5nVGV4dDogJycsXG5cdFx0XHRcdHN1Y2Nlc3M6IHRydWVcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdHRoaXMuZXJyb3JTdWIgPSBFdmVudHMuc3Vic2NyaWJlKCdlcnJvcicsIGZ1bmN0aW9uKHRleHQpIHtcblx0XHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0XHRlcnJvclRleHQ6IHRleHQsXG5cdFx0XHRcdGxvYWRpbmc6IGZhbHNlLFxuXHRcdFx0XHRsb2FkaW5nVGV4dDogJycsXG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fSxcblx0Y29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHJlbW92ZSBzdWJzY3JpYmVyc1xuXHRcdHRoaXMubG9hZGluZ1N1Yi5yZW1vdmUoKTtcblx0XHR0aGlzLmxvYWRpbmdEb25lU3ViLnJlbW92ZSgpO1xuXHRcdHRoaXMuZXJyb3JTdWIucmVtb3ZlKCk7XG5cdH0sXG5cdGhhbmRsZUNsaWNrOiBmdW5jdGlvbihlKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdEV2ZW50cy5wdWJsaXNoKCdsb2FkaW5nJywgXCJGZXRjaGluZyBsYXRlc3QgY29kZeKAplwiKTtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGZldGNoZWQ6IGZhbHNlXG5cdFx0fSk7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdFEoJC5hamF4KHtcblx0XHRcdHR5cGU6IFwiUE9TVFwiLFxuXHRcdFx0ZGF0YVR5cGU6ICdqc29uJyxcblx0XHRcdHVybDogdGhpcy5wcm9wcy5jb250ZXh0LnByb2plY3RVcmwgKyAnL2ZldGNoJ1xuXHRcdH0pKVxuXHRcdFx0LnRoZW4odGhpcy53YWl0Rm9yRmV0Y2hUb0NvbXBsZXRlLCB0aGlzLmZldGNoU3RhdHVzRXJyb3IpXG5cdFx0XHQudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0RXZlbnRzLnB1Ymxpc2goJ2xvYWRpbmcvZG9uZScpO1xuXHRcdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0XHRmZXRjaGVkOiB0cnVlXG5cdFx0XHRcdH0pXG5cdFx0XHR9KS5jYXRjaCh0aGlzLmZldGNoU3RhdHVzRXJyb3IpLmRvbmUoKTtcblx0fSxcblx0d2FpdEZvckZldGNoVG9Db21wbGV0ZTpmdW5jdGlvbiAoZmV0Y2hEYXRhKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHJldHVybiB0aGlzLmdldEZldGNoU3RhdHVzKGZldGNoRGF0YSkudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuXHRcdFx0aWYgKGRhdGEuc3RhdHVzID09PSBcIkNvbXBsZXRlXCIpIHtcblx0XHRcdFx0cmV0dXJuIGRhdGE7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZGF0YS5zdGF0dXMgPT09IFwiRmFpbGVkXCIpIHtcblx0XHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0XHRyZXR1cm4gZC5yZWplY3QoZGF0YSk7XG5cdFx0XHRcdH0pLnByb21pc2UoKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBzZWxmLndhaXRGb3JGZXRjaFRvQ29tcGxldGUoZmV0Y2hEYXRhKTtcblx0XHR9KTtcblx0fSxcblx0Z2V0RmV0Y2hTdGF0dXM6IGZ1bmN0aW9uIChmZXRjaERhdGEpIHtcblx0XHRyZXR1cm4gUSgkLmFqYXgoe1xuXHRcdFx0dHlwZTogXCJHRVRcIixcblx0XHRcdHVybDogZmV0Y2hEYXRhLmhyZWYsXG5cdFx0XHRkYXRhVHlwZTogJ2pzb24nXG5cdFx0fSkpO1xuXHR9LFxuXHRmZXRjaFN0YXR1c0Vycm9yOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dmFyIG1lc3NhZ2UgID0gJ1Vua25vd24gZXJyb3InO1xuXHRcdGlmKHR5cGVvZiBkYXRhLnJlc3BvbnNlVGV4dCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdG1lc3NhZ2UgPSBkYXRhLnJlc3BvbnNlVGV4dDtcblx0XHR9IGVsc2UgaWYgKHR5cGVvZiBkYXRhLm1lc3NhZ2UgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRtZXNzYWdlID0gZGF0YS5tZXNzYWdlO1xuXHRcdH1cblx0XHRFdmVudHMucHVibGlzaCgnZXJyb3InLCBtZXNzYWdlKTtcblx0fSxcblx0bGFzdEZldGNoZWRIYW5kbGVyOiBmdW5jdGlvbih0aW1lX2Fnbykge1xuXHRcdHRoaXMuc2V0U3RhdGUoe2xhc3RfZmV0Y2hlZDogdGltZV9hZ299KTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG5cdFx0XHRcImRlcGxveS1kcm9wZG93blwiOiB0cnVlLFxuXHRcdFx0XCJsb2FkaW5nXCI6IHRoaXMuc3RhdGUubG9hZGluZyxcblx0XHRcdFwic3VjY2Vzc1wiOiB0aGlzLnN0YXRlLnN1Y2Nlc3Ncblx0XHR9KTtcblxuXHRcdHZhciBmb3JtO1xuXG5cdFx0aWYodGhpcy5zdGF0ZS5lcnJvclRleHQgIT09IFwiXCIpIHtcblx0XHRcdGZvcm0gPSA8RXJyb3JNZXNzYWdlcyBtZXNzYWdlPXt0aGlzLnN0YXRlLmVycm9yVGV4dH0gLz5cblx0XHR9IGVsc2UgaWYodGhpcy5zdGF0ZS5mZXRjaGVkKSB7XG5cdFx0XHRmb3JtID0gPERlcGxveUZvcm0gY29udGV4dD17dGhpcy5wcm9wcy5jb250ZXh0fSBkYXRhPXt0aGlzLnByb3BzLmRhdGF9IGxhc3RGZXRjaGVkSGFuZGxlcj17dGhpcy5sYXN0RmV0Y2hlZEhhbmRsZXJ9IC8+XG5cdFx0fSBlbHNlIGlmICh0aGlzLnN0YXRlLmxvYWRpbmcpIHtcblx0XHRcdGZvcm0gPSA8TG9hZGluZ0RlcGxveUZvcm0gbWVzc2FnZT1cIkZldGNoaW5nIGxhdGVzdCBjb2RlJmhlbGxpcDtcIiAvPlxuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT17Y2xhc3Nlc30gb25DbGljaz17dGhpcy5oYW5kbGVDbGlja30+XG5cdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwic3RhdHVzLWljb25cIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+XG5cdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwidGltZVwiPmxhc3QgdXBkYXRlZCB7dGhpcy5zdGF0ZS5sYXN0X2ZldGNoZWR9PC9zcGFuPlxuXHRcdFx0XHRcdDxFbnZpcm9ubWVudE5hbWUgZW52aXJvbm1lbnROYW1lPXt0aGlzLnByb3BzLmNvbnRleHQuZW52TmFtZX0gLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdHtmb3JtfVxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBMb2FkaW5nRGVwbG95Rm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJkZXBsb3ktZm9ybS1sb2FkaW5nXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiaWNvbi1ob2xkZXJcIj5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1jb2cgZmEtc3BpblwiPjwvaT5cblx0XHRcdFx0XHQ8c3Bhbj57dGhpcy5wcm9wcy5tZXNzYWdlfTwvc3Bhbj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIEVycm9yTWVzc2FnZXMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZGVwbG95LWRyb3Bkb3duLWVycm9yc1wiPlxuXHRcdFx0XHR7dGhpcy5wcm9wcy5tZXNzYWdlfVxuXHRcdFx0PC9kaXY+XG5cdFx0KVxuXHR9XG59KTtcblxuLyoqXG4gKiBFbnZpcm9ubWVudE5hbWVcbiAqL1xudmFyIEVudmlyb25tZW50TmFtZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cImVudmlyb25tZW50LW5hbWVcIj5cblx0XHRcdFx0PGkgY2xhc3NOYW1lPVwiZmEgZmEtcm9ja2V0XCI+Jm5ic3A7PC9pPlxuXHRcdFx0XHREZXBsb3ltZW50IG9wdGlvbnMgPHNwYW4gY2xhc3NOYW1lPVwiaGlkZGVuLXhzXCI+Zm9yIHt0aGlzLnByb3BzLmVudmlyb25tZW50TmFtZX08L3NwYW4+XG5cdFx0XHQ8L3NwYW4+XG5cdFx0KTtcblx0fVxufSk7XG5cbi8qKlxuICogRGVwbG95Rm9ybVxuICovXG52YXIgRGVwbG95Rm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2VsZWN0ZWRUYWI6IDEsXG5cdFx0XHRkYXRhOiBbXVxuXHRcdH07XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmdpdERhdGEoKTtcblx0fSxcblxuXHRnaXREYXRhOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRsb2FkaW5nOiB0cnVlXG5cdFx0fSk7XG5cdFx0USgkLmFqYXgoe1xuXHRcdFx0dHlwZTogXCJQT1NUXCIsXG5cdFx0XHRkYXRhVHlwZTogJ2pzb24nLFxuXHRcdFx0dXJsOiB0aGlzLnByb3BzLmNvbnRleHQuZW52VXJsICsgJy9naXRfcmV2aXNpb25zJ1xuXHRcdH0pKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0XHRsb2FkaW5nOiBmYWxzZSxcblx0XHRcdFx0ZGF0YTogZGF0YS5UYWJzXG5cdFx0XHR9KTtcblx0XHRcdHNlbGYucHJvcHMubGFzdEZldGNoZWRIYW5kbGVyKGRhdGEubGFzdF9mZXRjaGVkKTtcblx0XHR9LCBmdW5jdGlvbihkYXRhKXtcblx0XHRcdEV2ZW50cy5wdWJsaXNoKCdlcnJvcicsIGRhdGEpO1xuXHRcdH0pO1xuXHR9LFxuXG5cdHNlbGVjdEhhbmRsZXI6IGZ1bmN0aW9uKGlkKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRUYWI6IGlkfSk7XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdGlmKHRoaXMuc3RhdGUubG9hZGluZykge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0PExvYWRpbmdEZXBsb3lGb3JtIG1lc3NhZ2U9XCJMb2FkaW5nJmhlbGxpcDtcIiAvPlxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJkZXBsb3ktZm9ybS1vdXRlciBjbGVhcmZpeFwiPlxuXHRcdFx0XHQ8Zm9ybSBjbGFzc05hbWU9XCJmb3JtLWlubGluZSBkZXBsb3ktZm9ybVwiIGFjdGlvbj1cIlBPU1RcIiBhY3Rpb249XCIjXCI+XG5cdFx0XHRcdFx0PERlcGxveVRhYlNlbGVjdG9yIGRhdGE9e3RoaXMuc3RhdGUuZGF0YX0gb25TZWxlY3Q9e3RoaXMuc2VsZWN0SGFuZGxlcn0gc2VsZWN0ZWRUYWI9e3RoaXMuc3RhdGUuc2VsZWN0ZWRUYWJ9IC8+XG5cdFx0XHRcdFx0PERlcGxveVRhYnMgY29udGV4dD17dGhpcy5wcm9wcy5jb250ZXh0fSBkYXRhPXt0aGlzLnN0YXRlLmRhdGF9IHNlbGVjdGVkVGFiPXt0aGlzLnN0YXRlLnNlbGVjdGVkVGFifSBTZWN1cml0eVRva2VuPXt0aGlzLnN0YXRlLlNlY3VyaXR5VG9rZW59IC8+XG5cdFx0XHRcdDwvZm9ybT5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG4vKipcbiAqIERlcGxveVRhYlNlbGVjdG9yXG4gKi9cbnZhciBEZXBsb3lUYWJTZWxlY3RvciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciBzZWxlY3RvcnMgPSB0aGlzLnByb3BzLmRhdGEubWFwKGZ1bmN0aW9uKHRhYikge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0PERlcGxveVRhYlNlbGVjdCBrZXk9e3RhYi5pZH0gdGFiPXt0YWJ9IG9uU2VsZWN0PXtzZWxmLnByb3BzLm9uU2VsZWN0fSBzZWxlY3RlZFRhYj17c2VsZi5wcm9wcy5zZWxlY3RlZFRhYn0gLz5cblx0XHRcdCk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIChcblx0XHRcdDx1bCBjbGFzc05hbWU9XCJTZWxlY3Rpb25Hcm91cCB0YWJiZWRzZWxlY3Rpb25ncm91cCBub2xhYmVsXCI+XG5cdFx0XHRcdHtzZWxlY3RvcnN9XG5cdFx0XHQ8L3VsPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG4vKipcbiAqIERlcGxveVRhYlNlbGVjdFxuICovXG52YXIgRGVwbG95VGFiU2VsZWN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRoYW5kbGVDbGljazogZnVuY3Rpb24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHR0aGlzLnByb3BzLm9uU2VsZWN0KHRoaXMucHJvcHMudGFiLmlkKVxuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgY2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG5cdFx0XHRcImFjdGl2ZVwiIDogKHRoaXMucHJvcHMuc2VsZWN0ZWRUYWIgPT0gdGhpcy5wcm9wcy50YWIuaWQpXG5cdFx0fSk7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxsaSBjbGFzc05hbWU9e2NsYXNzZXN9PlxuXHRcdFx0XHQ8YSBvbkNsaWNrPXt0aGlzLmhhbmRsZUNsaWNrfSBocmVmPXtcIiNkZXBsb3ktdGFiLVwiK3RoaXMucHJvcHMudGFiLmlkfSA+e3RoaXMucHJvcHMudGFiLm5hbWV9PC9hPlxuXHRcdFx0PC9saT5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG4vKipcbiAqIERlcGxveVRhYnNcbiAqL1xudmFyIERlcGxveVRhYnMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgdGFicyA9IHRoaXMucHJvcHMuZGF0YS5tYXAoZnVuY3Rpb24odGFiKSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQ8RGVwbG95VGFiIGNvbnRleHQ9e3NlbGYucHJvcHMuY29udGV4dH0ga2V5PXt0YWIuaWR9IHRhYj17dGFifSBzZWxlY3RlZFRhYj17c2VsZi5wcm9wcy5zZWxlY3RlZFRhYn0gU2VjdXJpdHlUb2tlbj17c2VsZi5wcm9wcy5TZWN1cml0eVRva2VufSAvPlxuXHRcdFx0KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInRhYi1jb250ZW50XCI+XG5cdFx0XHRcdHt0YWJzfVxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbi8qKlxuICogRGVwbG95VGFiXG4gKi9cbnZhciBEZXBsb3lUYWIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHN1bW1hcnk6IHRoaXMuZ2V0SW5pdGlhbFN1bW1hcnlTdGF0ZSgpLFxuXHRcdFx0b3B0aW9uczoge30sXG5cdFx0XHRzaGE6ICcnXG5cdFx0fTtcblx0fSxcblx0Z2V0SW5pdGlhbFN1bW1hcnlTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNoYW5nZXM6IHt9LFxuXHRcdFx0bWVzc2FnZXM6IFtdLFxuXHRcdFx0dmFsaWRhdGlvbkNvZGU6ICcnLFxuXHRcdFx0ZXN0aW1hdGVkVGltZTogbnVsbCxcblx0XHRcdGFjdGlvbkNvZGU6IG51bGwsXG5cdFx0XHRpbml0aWFsU3RhdGU6IHRydWVcblx0XHR9XG5cdH0sXG5cdE9wdGlvbkNoYW5nZUhhbmRsZXI6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIG9wdGlvbnMgPSB0aGlzLnN0YXRlLm9wdGlvbnM7XG5cdFx0b3B0aW9uc1tldmVudC50YXJnZXQubmFtZV0gPSBldmVudC50YXJnZXQuY2hlY2tlZDtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdG9wdGlvbnM6IG9wdGlvbnNcblx0XHR9KTtcblx0fSxcblx0U0hBQ2hhbmdlSGFuZGxlcjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdHNoYTogZXZlbnQudGFyZ2V0LnZhbHVlXG5cdFx0fSk7XG5cdH0sXG5cdGNoYW5nZUhhbmRsZXI6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0c3VtbWFyeTogdGhpcy5nZXRJbml0aWFsU3VtbWFyeVN0YXRlKClcblx0XHR9KTtcblxuXHRcdGlmKGV2ZW50LnRhcmdldC52YWx1ZSA9PT0gXCJcIikge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdEV2ZW50cy5wdWJsaXNoKCdjaGFuZ2VfbG9hZGluZycpO1xuXG5cdFx0dmFyIHNoYSA9IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5zaGFfc2VsZWN0b3IucmVmcy5zaGEpLnZhbHVlO1xuXHRcdHZhciBicmFuY2ggPSBudWxsO1xuXG5cdFx0Zm9yICh2YXIgaSBpbiB0aGlzLnByb3BzLnRhYi5maWVsZF9kYXRhKSB7XG5cdFx0XHRpZiAodGhpcy5wcm9wcy50YWIuZmllbGRfZGF0YVtpXS5pZCA9PT0gc2hhKSB7XG5cdFx0XHRcdGJyYW5jaCA9IHRoaXMucHJvcHMudGFiLmZpZWxkX2RhdGFbaV0uYnJhbmNoX25hbWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dmFyIHN1bW1hcnlEYXRhID0ge1xuXHRcdFx0c2hhOiBzaGEsXG5cdFx0XHRicmFuY2g6IGJyYW5jaCxcblx0XHRcdFNlY3VyaXR5SUQ6IHRoaXMucHJvcHMuU2VjdXJpdHlUb2tlblxuXHRcdH07XG5cdFx0Ly8gbWVyZ2UgdGhlICdhZHZhbmNlZCcgb3B0aW9ucyBpZiB0aGV5IGFyZSBzZXRcblx0XHRmb3IgKHZhciBhdHRybmFtZSBpbiB0aGlzLnN0YXRlLm9wdGlvbnMpIHtcblx0XHRcdGlmKHRoaXMuc3RhdGUub3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShhdHRybmFtZSkpIHtcblx0XHRcdFx0c3VtbWFyeURhdGFbYXR0cm5hbWVdID0gdGhpcy5zdGF0ZS5vcHRpb25zW2F0dHJuYW1lXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0USgkLmFqYXgoe1xuXHRcdFx0dHlwZTogXCJQT1NUXCIsXG5cdFx0XHRkYXRhVHlwZTogJ2pzb24nLFxuXHRcdFx0dXJsOiB0aGlzLnByb3BzLmNvbnRleHQuZW52VXJsICsgJy9kZXBsb3lfc3VtbWFyeScsXG5cdFx0XHRkYXRhOiBzdW1tYXJ5RGF0YVxuXHRcdH0pKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0XHRzdW1tYXJ5OiBkYXRhXG5cdFx0XHR9KTtcblx0XHRcdEV2ZW50cy5wdWJsaXNoKCdjaGFuZ2VfbG9hZGluZy9kb25lJyk7XG5cdFx0fS5iaW5kKHRoaXMpLCBmdW5jdGlvbigpe1xuXHRcdFx0RXZlbnRzLnB1Ymxpc2goJ2NoYW5nZV9sb2FkaW5nL2RvbmUnKTtcblx0XHR9KTtcblx0fSxcblxuXHRzaG93T3B0aW9uczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMucHJvcHMudGFiLmFkdmFuY2VkX29wdHMgPT09ICd0cnVlJztcblx0fSxcblxuXHRzaG93VmVyaWZ5QnV0dG9uOiBmdW5jdGlvbigpIHtcblx0XHRpZih0aGlzLnNob3dPcHRpb25zKCkpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5wcm9wcy50YWIuZmllbGRfdHlwZSA9PSAndGV4dGZpZWxkJztcblx0fSxcblxuXHRzaGFDaG9zZW46IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAodGhpcy5zdGF0ZS5zaGEgIT09ICcnKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgY2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG5cdFx0XHRcInRhYi1wYW5lXCI6IHRydWUsXG5cdFx0XHRcImNsZWFyZml4XCI6IHRydWUsXG5cdFx0XHRcImFjdGl2ZVwiIDogKHRoaXMucHJvcHMuc2VsZWN0ZWRUYWIgPT0gdGhpcy5wcm9wcy50YWIuaWQpXG5cdFx0fSk7XG5cblx0XHQvLyBzZXR1cCB0aGUgZHJvcGRvd24gb3IgdGhlIHRleHQgaW5wdXQgZm9yIHNlbGVjdGluZyBhIFNIQVxuXHRcdHZhciBzZWxlY3Rvcjtcblx0XHRpZiAodGhpcy5wcm9wcy50YWIuZmllbGRfdHlwZSA9PSAnZHJvcGRvd24nKSB7XG5cdFx0XHR2YXIgY2hhbmdlSGFuZGxlciA9IHRoaXMuY2hhbmdlSGFuZGxlcjtcblx0XHRcdGlmKHRoaXMuc2hvd1ZlcmlmeUJ1dHRvbigpKSB7IGNoYW5nZUhhbmRsZXIgPSB0aGlzLlNIQUNoYW5nZUhhbmRsZXIgfVxuXHRcdFx0c2VsZWN0b3IgPSA8U2VsZWN0b3JEcm9wZG93biByZWY9XCJzaGFfc2VsZWN0b3JcIiB0YWI9e3RoaXMucHJvcHMudGFifSBjaGFuZ2VIYW5kbGVyPXtjaGFuZ2VIYW5kbGVyfSAvPlxuXHRcdH0gZWxzZSBpZiAodGhpcy5wcm9wcy50YWIuZmllbGRfdHlwZSA9PSAndGV4dGZpZWxkJykge1xuXHRcdFx0c2VsZWN0b3IgPSA8U2VsZWN0b3JUZXh0IHJlZj1cInNoYV9zZWxlY3RvclwiIHRhYj17dGhpcy5wcm9wcy50YWJ9IGNoYW5nZUhhbmRsZXI9e3RoaXMuU0hBQ2hhbmdlSGFuZGxlcn0gLz5cblx0XHR9XG5cblx0XHQvLyAnQWR2YW5jZWQnIG9wdGlvbnNcblx0XHR2YXIgb3B0aW9ucyA9IG51bGw7XG5cdFx0aWYodGhpcy5zaG93T3B0aW9ucygpKSB7XG5cdFx0XHRvcHRpb25zID0gPEFkdmFuY2VkT3B0aW9ucyB0YWI9e3RoaXMucHJvcHMudGFifSBjaGFuZ2VIYW5kbGVyPXt0aGlzLk9wdGlvbkNoYW5nZUhhbmRsZXJ9IC8+XG5cdFx0fVxuXG5cdFx0Ly8gJ1RoZSB2ZXJpZnkgYnV0dG9uJ1xuXHRcdHZhciB2ZXJpZnlCdXR0b24gPSBudWxsO1xuXHRcdGlmKHRoaXMuc2hvd1ZlcmlmeUJ1dHRvbigpKSB7XG5cdFx0XHR2ZXJpZnlCdXR0b24gPSA8VmVyaWZ5QnV0dG9uIGRpc2FibGVkPXshdGhpcy5zaGFDaG9zZW4oKX0gY2hhbmdlSGFuZGxlcj17dGhpcy5jaGFuZ2VIYW5kbGVyfSAvPlxuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGlkPXtcImRlcGxveS10YWItXCIrdGhpcy5wcm9wcy50YWIuaWR9IGNsYXNzTmFtZT17Y2xhc3Nlc30+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VjdGlvblwiPlxuXHRcdFx0XHRcdDxkaXYgaHRtbEZvcj17dGhpcy5wcm9wcy50YWIuZmllbGRfaWR9IGNsYXNzTmFtZT1cImhlYWRlclwiPlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwibnVtYmVyQ2lyY2xlXCI+MTwvc3Bhbj4ge3RoaXMucHJvcHMudGFiLmZpZWxkX2xhYmVsfVxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdHtzZWxlY3Rvcn1cblx0XHRcdFx0XHR7b3B0aW9uc31cblx0XHRcdFx0XHR7dmVyaWZ5QnV0dG9ufVxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PERlcGxveVBsYW4gY29udGV4dD17dGhpcy5wcm9wcy5jb250ZXh0fSBzdW1tYXJ5PXt0aGlzLnN0YXRlLnN1bW1hcnl9IC8+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIFNlbGVjdG9yRHJvcGRvd24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHQkKFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5zaGEpKS5zZWxlY3QyKHtcblx0XHRcdC8vIExvYWQgZGF0YSBpbnRvIHRoZSBzZWxlY3QyLlxuXHRcdFx0Ly8gVGhlIGZvcm1hdCBzdXBwb3J0cyBvcHRncm91cHMsIGFuZCBsb29rcyBsaWtlIHRoaXM6XG5cdFx0XHQvLyBbe3RleHQ6ICdvcHRncm91cCB0ZXh0JywgY2hpbGRyZW46IFt7aWQ6ICc8c2hhPicsIHRleHQ6ICc8aW5uZXIgdGV4dD4nfV19XVxuXHRcdFx0ZGF0YTogdGhpcy5wcm9wcy50YWIuZmllbGRfZGF0YVxuXHRcdH0pO1xuXG5cdFx0Ly8gVHJpZ2dlciBoYW5kbGVyIG9ubHkgbmVlZGVkIGlmIHRoZXJlIGlzIG5vIGV4cGxpY2l0IGJ1dHRvbi5cblx0XHRpZih0aGlzLnByb3BzLmNoYW5nZUhhbmRsZXIpIHtcblx0XHRcdCQoUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLnNoYSkpLnNlbGVjdDIoKS5vbihcImNoYW5nZVwiLCB0aGlzLnByb3BzLmNoYW5nZUhhbmRsZXIpO1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIEZyb20gaHR0cHM6Ly9zZWxlY3QyLmdpdGh1Yi5pby9leGFtcGxlcy5odG1sIFwiVGhlIGJlc3Qgd2F5IHRvIGVuc3VyZSB0aGF0IFNlbGVjdDIgaXMgdXNpbmcgYSBwZXJjZW50IGJhc2VkXG5cdFx0Ly8gd2lkdGggaXMgdG8gaW5saW5lIHRoZSBzdHlsZSBkZWNsYXJhdGlvbiBpbnRvIHRoZSB0YWdcIi5cblx0XHR2YXIgc3R5bGUgPSB7d2lkdGg6ICcxMDAlJ307XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmaWVsZFwiPlxuXHRcdFx0XHRcdDxzZWxlY3Rcblx0XHRcdFx0XHRcdHJlZj1cInNoYVwiXG5cdFx0XHRcdFx0XHRpZD17dGhpcy5wcm9wcy50YWIuZmllbGRfaWR9XG5cdFx0XHRcdFx0XHRuYW1lPVwic2hhXCJcblx0XHRcdFx0XHRcdGNsYXNzTmFtZT1cImRyb3Bkb3duXCJcblx0XHRcdFx0XHRcdG9uQ2hhbmdlPXt0aGlzLnByb3BzLmNoYW5nZUhhbmRsZXJ9XG5cdFx0XHRcdFx0XHRzdHlsZT17c3R5bGV9PlxuXHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIlwiPlNlbGVjdCB7dGhpcy5wcm9wcy50YWIuZmllbGRfaWR9PC9vcHRpb24+XG5cdFx0XHRcdFx0PC9zZWxlY3Q+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBTZWxlY3RvclRleHQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmaWVsZFwiPlxuXHRcdFx0XHQ8aW5wdXRcblx0XHRcdFx0XHR0eXBlPVwidGV4dFwiXG5cdFx0XHRcdFx0cmVmPVwic2hhXCJcblx0XHRcdFx0XHRpZD17dGhpcy5wcm9wcy50YWIuZmllbGRfaWR9XG5cdFx0XHRcdFx0bmFtZT1cInNoYVwiXG5cdFx0XHRcdFx0Y2xhc3NOYW1lPVwidGV4dFwiXG5cdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMucHJvcHMuY2hhbmdlSGFuZGxlcn1cblx0XHRcdFx0Lz5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgVmVyaWZ5QnV0dG9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIlwiPlxuXHRcdFx0XHQ8YnV0dG9uXG5cdFx0XHRcdFx0ZGlzYWJsZWQ9e3RoaXMucHJvcHMuZGlzYWJsZWR9XG5cdFx0XHRcdFx0dmFsdWU9XCJWZXJpZnkgZGVwbG95bWVudFwiXG5cdFx0XHRcdFx0Y2xhc3NOYW1lPVwiYnRuIGJ0bi1kZWZhdWx0XCJcblx0XHRcdFx0XHRvbkNsaWNrPXt0aGlzLnByb3BzLmNoYW5nZUhhbmRsZXJ9PlxuXHRcdFx0XHRcdFZlcmlmeSBkZXBsb3ltZW50XG5cdFx0XHRcdDwvYnV0dG9uPlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBBZHZhbmNlZE9wdGlvbnMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImRlcGxveS1vcHRpb25zXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZmllbGRjaGVja2JveFwiPlxuXHRcdFx0XHRcdDxsYWJlbD5cblx0XHRcdFx0XHRcdDxpbnB1dFxuXHRcdFx0XHRcdFx0XHR0eXBlPVwiY2hlY2tib3hcIlxuXHRcdFx0XHRcdFx0XHRuYW1lPVwiZm9yY2VfZnVsbFwiXG5cdFx0XHRcdFx0XHRcdG9uQ2hhbmdlPXt0aGlzLnByb3BzLmNoYW5nZUhhbmRsZXJ9XG5cdFx0XHRcdFx0XHQvPlxuXHRcdFx0XHRcdFx0Rm9yY2UgZnVsbCBkZXBsb3ltZW50XG5cdFx0XHRcdFx0PC9sYWJlbD5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZmllbGRjaGVja2JveFwiPlxuXHRcdFx0XHRcdDxsYWJlbD5cblx0XHRcdFx0XHRcdDxpbnB1dFxuXHRcdFx0XHRcdFx0XHR0eXBlPVwiY2hlY2tib3hcIlxuXHRcdFx0XHRcdFx0XHRuYW1lPVwibm9yb2xsYmFja1wiXG5cdFx0XHRcdFx0XHRcdG9uQ2hhbmdlPXt0aGlzLnByb3BzLmNoYW5nZUhhbmRsZXJ9XG5cdFx0XHRcdFx0XHQvPlxuXHRcdFx0XHRcdFx0Tm8gcm9sbGJhY2sgb24gZGVwbG95IGZhaWx1cmVcblx0XHRcdFx0XHQ8L2xhYmVsPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERlcGxveW1lbnREaWFsb2c7XG4iLCIvKipcbiAqIEEgc2ltcGxlIHB1YiBzdWIgZXZlbnQgaGFuZGxlciBmb3IgaW50ZXJjb21wb25lbnQgY29tbXVuaWNhdGlvblxuICovXG52YXIgdG9waWNzID0ge307XG52YXIgaE9QID0gdG9waWNzLmhhc093blByb3BlcnR5O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0c3Vic2NyaWJlOiBmdW5jdGlvbih0b3BpYywgbGlzdGVuZXIpIHtcblx0XHQvLyBDcmVhdGUgdGhlIHRvcGljJ3Mgb2JqZWN0IGlmIG5vdCB5ZXQgY3JlYXRlZFxuXHRcdGlmKCFoT1AuY2FsbCh0b3BpY3MsIHRvcGljKSkgdG9waWNzW3RvcGljXSA9IFtdO1xuXG5cdFx0Ly8gQWRkIHRoZSBsaXN0ZW5lciB0byBxdWV1ZVxuXHRcdHZhciBpbmRleCA9IHRvcGljc1t0b3BpY10ucHVzaChsaXN0ZW5lcikgLTE7XG5cblx0XHQvLyBQcm92aWRlIGhhbmRsZSBiYWNrIGZvciByZW1vdmFsIG9mIHRvcGljXG5cdFx0cmV0dXJuIHtcblx0XHRcdHJlbW92ZTogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdGRlbGV0ZSB0b3BpY3NbdG9waWNdW2luZGV4XTtcblx0XHRcdH1cblx0XHR9O1xuXHR9LFxuXG5cdHB1Ymxpc2g6IGZ1bmN0aW9uKHRvcGljLCBpbmZvKSB7XG5cdFx0Ly8gSWYgdGhlIHRvcGljIGRvZXNuJ3QgZXhpc3QsIG9yIHRoZXJlJ3Mgbm8gbGlzdGVuZXJzIGluIHF1ZXVlLCBqdXN0IGxlYXZlXG5cdFx0aWYoIWhPUC5jYWxsKHRvcGljcywgdG9waWMpKSByZXR1cm47XG5cblx0XHQvLyBDeWNsZSB0aHJvdWdoIHRvcGljcyBxdWV1ZSwgZmlyZSFcblx0XHR0b3BpY3NbdG9waWNdLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuXHRcdFx0aXRlbShpbmZvICE9IHVuZGVmaW5lZCA/IGluZm8gOiB7fSk7XG5cdFx0fSk7XG5cdH1cbn07XG4iLCIvKipcbiAqIEhlbHBlciBjbGFzcyB0byBjb25jYXRpbmF0ZSBzdHJpbmdzIGRlcGVkaW5nIG9uIGEgdHJ1ZSBvciBmYWxzZS5cbiAqXG4gKiBFeGFtcGxlOlxuICogdmFyIGNsYXNzZXMgPSBIZWxwZXJzLmNsYXNzTmFtZXMoe1xuICogICAgIFwiZGVwbG95LWRyb3Bkb3duXCI6IHRydWUsXG4gKiAgICAgXCJsb2FkaW5nXCI6IGZhbHNlLFxuICogICAgIFwib3BlblwiOiB0cnVlLFxuICogfSk7XG4gKlxuICogdGhlbiBjbGFzc2VzIHdpbGwgZXF1YWwgXCJkZXBsb3ktZHJvcGRvd24gb3BlblwiXG4gKlxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cdGNsYXNzTmFtZXM6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgY2xhc3NlcyA9ICcnO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgYXJnID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0aWYgKCFhcmcpIGNvbnRpbnVlO1xuXG5cdFx0XHR2YXIgYXJnVHlwZSA9IHR5cGVvZiBhcmc7XG5cblx0XHRcdGlmICgnc3RyaW5nJyA9PT0gYXJnVHlwZSB8fCAnbnVtYmVyJyA9PT0gYXJnVHlwZSkge1xuXHRcdFx0XHRjbGFzc2VzICs9ICcgJyArIGFyZztcblxuXHRcdFx0fSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcblx0XHRcdFx0Y2xhc3NlcyArPSAnICcgKyBjbGFzc05hbWVzLmFwcGx5KG51bGwsIGFyZyk7XG5cblx0XHRcdH0gZWxzZSBpZiAoJ29iamVjdCcgPT09IGFyZ1R5cGUpIHtcblx0XHRcdFx0Zm9yICh2YXIga2V5IGluIGFyZykge1xuXHRcdFx0XHRcdGlmIChhcmcuaGFzT3duUHJvcGVydHkoa2V5KSAmJiBhcmdba2V5XSkge1xuXHRcdFx0XHRcdFx0Y2xhc3NlcyArPSAnICcgKyBrZXk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBjbGFzc2VzLnN1YnN0cigxKTtcblx0fVxufVxuIiwidmFyIERlcGxveW1lbnREaWFsb2cgPSByZXF1aXJlKCcuL2RlcGxveW1lbnRfZGlhbG9nLmpzeCcpO1xuXG4vLyBNb3VudCB0aGUgY29tcG9uZW50IG9ubHkgb24gdGhlIHBhZ2Ugd2hlcmUgdGhlIGhvbGRlciBpcyBhY3R1YWxseSBwcmVzZW50LlxudmFyIGhvbGRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZXBsb3ltZW50LWRpYWxvZy1ob2xkZXInKTtcbmlmIChob2xkZXIpIHtcblx0UmVhY3QucmVuZGVyKFxuXHRcdDxEZXBsb3ltZW50RGlhbG9nIGNvbnRleHQgPSB7ZW52aXJvbm1lbnRDb25maWdDb250ZXh0fSAvPixcblx0XHRob2xkZXJcblx0KTtcbn1cblxuXG4iLCJcbi8qKlxuICogQGpzeCBSZWFjdC5ET01cbiAqL1xudmFyIFN1bW1hcnlUYWJsZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0aXNFbXB0eTogZnVuY3Rpb24ob2JqKSB7XG5cdFx0Zm9yICh2YXIga2V5IGluIG9iaikge1xuXHRcdFx0aWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIG9ialtrZXldKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHRydWU7XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNoYW5nZXMgPSB0aGlzLnByb3BzLmNoYW5nZXM7XG5cdFx0aWYodGhpcy5pc0VtcHR5KGNoYW5nZXMpKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdFx0dmFyIGlkeCA9IDA7XG5cdFx0dmFyIHN1bW1hcnlMaW5lcyA9IE9iamVjdC5rZXlzKGNoYW5nZXMpLm1hcChmdW5jdGlvbihrZXkpIHtcblx0XHRcdGlkeCsrO1xuXG5cdFx0XHR2YXIgY29tcGFyZVVybCA9IG51bGw7XG5cdFx0XHRpZih0eXBlb2YgY2hhbmdlc1trZXldLmNvbXBhcmVVcmwgIT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0Y29tcGFyZVVybCA9IGNoYW5nZXNba2V5XS5jb21wYXJlVXJsO1xuXHRcdFx0fVxuXG5cdFx0XHRpZih0eXBlb2YgY2hhbmdlc1trZXldLmRlc2NyaXB0aW9uIT09J3VuZGVmaW5lZCcpIHtcblxuXHRcdFx0XHRpZiAoY2hhbmdlc1trZXldLmRlc2NyaXB0aW9uIT09XCJcIikge1xuXHRcdFx0XHRcdHJldHVybiA8RGVzY3JpcHRpb25Pbmx5U3VtbWFyeUxpbmUga2V5PXtpZHh9IG5hbWU9e2tleX0gZGVzY3JpcHRpb249e2NoYW5nZXNba2V5XS5kZXNjcmlwdGlvbn0gLz5cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gPFVuY2hhbmdlZFN1bW1hcnlMaW5lIGtleT17aWR4fSBuYW1lPXtrZXl9IHZhbHVlPVwiXCIgLz5cblx0XHRcdFx0fVxuXG5cdFx0XHR9IGVsc2UgaWYoY2hhbmdlc1trZXldLmZyb20gIT0gY2hhbmdlc1trZXldLnRvKSB7XG5cdFx0XHRcdHJldHVybiA8U3VtbWFyeUxpbmUga2V5PXtpZHh9IG5hbWU9e2tleX0gZnJvbT17Y2hhbmdlc1trZXldLmZyb219IHRvPXtjaGFuZ2VzW2tleV0udG99IGNvbXBhcmVVcmw9e2NvbXBhcmVVcmx9IC8+XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gPFVuY2hhbmdlZFN1bW1hcnlMaW5lIGtleT17aWR4fSBuYW1lPXtrZXl9IHZhbHVlPXtjaGFuZ2VzW2tleV0uZnJvbX0gLz5cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8dGFibGUgY2xhc3NOYW1lPVwidGFibGUgdGFibGUtc3RyaXBlZCB0YWJsZS1ob3ZlclwiPlxuXHRcdFx0XHQ8dGJvZHk+XG5cdFx0XHRcdFx0e3N1bW1hcnlMaW5lc31cblx0XHRcdFx0PC90Ym9keT5cblx0XHRcdDwvdGFibGU+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBTdW1tYXJ5TGluZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZnJvbSA9IHRoaXMucHJvcHMuZnJvbSxcblx0XHRcdHRvID0gdGhpcy5wcm9wcy50bztcblxuXHRcdC8vIG5haXZlIGdpdCBzaGEgZGV0ZWN0aW9uXG5cdFx0aWYoZnJvbSAhPT0gbnVsbCAmJiBmcm9tLmxlbmd0aCA9PT0gNDApIHtcblx0XHRcdGZyb20gPSBmcm9tLnN1YnN0cmluZygwLDcpO1xuXHRcdH1cblxuXHRcdC8vIG5haXZlIGdpdCBzaGEgZGV0ZWN0aW9uXG5cdFx0aWYodG8gIT09IG51bGwgJiYgdG8ubGVuZ3RoID09PSA0MCkge1xuXHRcdFx0dG8gPSB0by5zdWJzdHJpbmcoMCw3KTtcblx0XHR9XG5cblx0XHR2YXIgY29tcGFyZVVybCA9IG51bGw7XG5cdFx0aWYodGhpcy5wcm9wcy5jb21wYXJlVXJsICE9PSBudWxsKSB7XG5cdFx0XHRjb21wYXJlVXJsID0gPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj17dGhpcy5wcm9wcy5jb21wYXJlVXJsfT5WaWV3IGRpZmY8L2E+XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDx0cj5cblx0XHRcdFx0PHRoIHNjb3BlPVwicm93XCI+e3RoaXMucHJvcHMubmFtZX08L3RoPlxuXHRcdFx0XHQ8dGQ+e2Zyb219PC90ZD5cblx0XHRcdFx0PHRkPjxzcGFuIGNsYXNzTmFtZT1cImdseXBoaWNvbiBnbHlwaGljb24tYXJyb3ctcmlnaHRcIiAvPjwvdGQ+XG5cdFx0XHRcdDx0ZD57dG99PC90ZD5cblx0XHRcdFx0PHRkIGNsYXNzTmFtZT1cImNoYW5nZUFjdGlvblwiPntjb21wYXJlVXJsfTwvdGQ+XG5cdFx0XHQ8L3RyPlxuXHRcdClcblx0fVxufSk7XG5cbnZhciBVbmNoYW5nZWRTdW1tYXJ5TGluZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZnJvbSA9IHRoaXMucHJvcHMudmFsdWU7XG5cdFx0Ly8gbmFpdmUgZ2l0IHNoYSBkZXRlY3Rpb25cblx0XHRpZihmcm9tICE9PSBudWxsICYmIGZyb20ubGVuZ3RoID09PSA0MCkge1xuXHRcdFx0ZnJvbSA9IGZyb20uc3Vic3RyaW5nKDAsNyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDx0cj5cblx0XHRcdFx0PHRoIHNjb3BlPVwicm93XCI+e3RoaXMucHJvcHMubmFtZX08L3RoPlxuXHRcdFx0XHQ8dGQ+e2Zyb219PC90ZD5cblx0XHRcdFx0PHRkPiZuYnNwOzwvdGQ+XG5cdFx0XHRcdDx0ZD48c3BhbiBjbGFzc05hbWU9XCJsYWJlbCBsYWJlbC1zdWNjZXNzXCI+VW5jaGFuZ2VkPC9zcGFuPjwvdGQ+XG5cdFx0XHRcdDx0ZD4mbmJzcDs8L3RkPlxuXHRcdFx0PC90cj5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIERlc2NyaXB0aW9uT25seVN1bW1hcnlMaW5lID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8dHI+XG5cdFx0XHRcdDx0aCBzY29wZT1cInJvd1wiPnt0aGlzLnByb3BzLm5hbWV9PC90aD5cblx0XHRcdFx0PHRkIGNvbFNwYW49XCI0XCIgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3tfX2h0bWw6IHRoaXMucHJvcHMuZGVzY3JpcHRpb259fSAvPlxuXHRcdFx0PC90cj5cblx0XHQpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdW1tYXJ5VGFibGU7XG4iXX0=
