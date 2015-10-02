(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var DeploymentDialog = require('./deployment_dialog.jsx');

// Mount the component only on the page where the holder is actually present.
var holder = document.getElementById('deployment-dialog-holder');
if (holder) {
	React.render(
		React.createElement(DeploymentDialog, {context: environmentConfigContext}),
		holder
	);
}

},{"./deployment_dialog.jsx":3}],2:[function(require,module,exports){
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

},{"./events.js":4,"./helpers.js":5,"./summary_table.jsx":6}],3:[function(require,module,exports){
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

},{"./deploy_plan.jsx":2,"./events.js":4,"./helpers.js":5}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbXV6ZG93c2tpL1NpdGVzL2RlcGxveS1zaWx2ZXJzdHJpcGUtY29tL2RlcGxveW5hdXQvanMvYmFzZS5qc3giLCIvVXNlcnMvbXV6ZG93c2tpL1NpdGVzL2RlcGxveS1zaWx2ZXJzdHJpcGUtY29tL2RlcGxveW5hdXQvanMvZGVwbG95X3BsYW4uanN4IiwiL1VzZXJzL211emRvd3NraS9TaXRlcy9kZXBsb3ktc2lsdmVyc3RyaXBlLWNvbS9kZXBsb3luYXV0L2pzL2RlcGxveW1lbnRfZGlhbG9nLmpzeCIsIi9Vc2Vycy9tdXpkb3dza2kvU2l0ZXMvZGVwbG95LXNpbHZlcnN0cmlwZS1jb20vZGVwbG95bmF1dC9qcy9ldmVudHMuanMiLCIvVXNlcnMvbXV6ZG93c2tpL1NpdGVzL2RlcGxveS1zaWx2ZXJzdHJpcGUtY29tL2RlcGxveW5hdXQvanMvaGVscGVycy5qcyIsIi9Vc2Vycy9tdXpkb3dza2kvU2l0ZXMvZGVwbG95LXNpbHZlcnN0cmlwZS1jb20vZGVwbG95bmF1dC9qcy9zdW1tYXJ5X3RhYmxlLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUksZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUM7O0FBRTFELDZFQUE2RTtBQUM3RSxJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFDakUsSUFBSSxNQUFNLEVBQUU7Q0FDWCxLQUFLLENBQUMsTUFBTTtFQUNYLG9CQUFDLGdCQUFnQixFQUFBLENBQUEsQ0FBQyxPQUFBLEVBQU8sR0FBSSx3QkFBeUIsQ0FBQSxDQUFHLENBQUE7RUFDekQsTUFBTTtFQUNOLENBQUM7Q0FDRjs7O0FDVEQsSUFBSSxNQUFNLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQ3BDLElBQUksT0FB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QSxFQUFBO0lBQy9ELG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUEsR0FBVyxDQUFBO0dBQ1gsQ0FBQTtJQUNKO0VBQ0Y7QUFDRixDQUFDLENBQUMsQ0FBQzs7QUFFSCxJQUFJLGdEQUFnRCwwQ0FBQTtDQUNuRCxNQUFNLEVBQUUsV0FBVztFQUNsQjtHQUNDLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUE7SUFDSCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLEtBQUEsRUFBSyxDQUFDLEtBQU0sQ0FBQSxFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBVSxDQUFBLEVBQUE7SUFDdEMsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxPQUFBLEVBQU8sQ0FBQyxHQUFBLEVBQUcsQ0FBQyx1QkFBQSxFQUF1QixDQUFFLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFFLENBQUEsQ0FBRyxDQUFBO0dBQ3pFLENBQUE7SUFDSjtFQUNGO0FBQ0YsQ0FBQyxDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxZQUFZLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIERlcGxveW1lbnREaWFsb2cgPSByZXF1aXJlKCcuL2RlcGxveW1lbnRfZGlhbG9nLmpzeCcpO1xuXG4vLyBNb3VudCB0aGUgY29tcG9uZW50IG9ubHkgb24gdGhlIHBhZ2Ugd2hlcmUgdGhlIGhvbGRlciBpcyBhY3R1YWxseSBwcmVzZW50LlxudmFyIGhvbGRlciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZXBsb3ltZW50LWRpYWxvZy1ob2xkZXInKTtcbmlmIChob2xkZXIpIHtcblx0UmVhY3QucmVuZGVyKFxuXHRcdDxEZXBsb3ltZW50RGlhbG9nIGNvbnRleHQgPSB7ZW52aXJvbm1lbnRDb25maWdDb250ZXh0fSAvPixcblx0XHRob2xkZXJcblx0KTtcbn1cbiIsInZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cy5qcycpO1xudmFyIEhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMuanMnKTtcbnZhciBTdW1tYXJ5VGFibGUgPSByZXF1aXJlKCcuL3N1bW1hcnlfdGFibGUuanN4Jyk7XG5cbnZhciBEZXBsb3lQbGFuID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRsb2FkaW5nU3ViOiBudWxsLFxuXHRsb2FkaW5nRG9uZVN1YjogbnVsbCxcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0bG9hZGluZ19jaGFuZ2VzOiBmYWxzZSxcblx0XHRcdGRlcGxveV9kaXNhYmxlZDogZmFsc2UsXG5cdFx0XHRkZXBsb3lIb3ZlcjogZmFsc2Vcblx0XHR9XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0Ly8gcmVnaXN0ZXIgc3Vic2NyaWJlcnNcblx0XHR0aGlzLmxvYWRpbmdTdWIgPSBFdmVudHMuc3Vic2NyaWJlKCdjaGFuZ2VfbG9hZGluZycsIGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0XHRsb2FkaW5nX2NoYW5nZXM6IHRydWVcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdHRoaXMubG9hZGluZ0RvbmVTdWIgPSBFdmVudHMuc3Vic2NyaWJlKCdjaGFuZ2VfbG9hZGluZy9kb25lJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdGxvYWRpbmdfY2hhbmdlczogZmFsc2Vcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9LFxuXHRkZXBsb3lIYW5kbGVyOiBmdW5jdGlvbihldmVudCkge1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRkZXBsb3lfZGlzYWJsZWQ6IHRydWVcblx0XHR9KTtcblxuXHRcdFEoJC5hamF4KHtcblx0XHRcdHR5cGU6IFwiUE9TVFwiLFxuXHRcdFx0ZGF0YVR5cGU6ICdqc29uJyxcblx0XHRcdHVybDogdGhpcy5wcm9wcy5jb250ZXh0LmVudlVybCArICcvc3RhcnQtZGVwbG95Jyxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0Ly8gUGFzcyB0aGUgc3RyYXRlZ3kgb2JqZWN0IHRoZSB1c2VyIGhhcyBqdXN0IHNpZ25lZCBvZmYgYmFjayB0byB0aGUgYmFja2VuZC5cblx0XHRcdFx0J3N0cmF0ZWd5JzogdGhpcy5wcm9wcy5zdW1tYXJ5LFxuXHRcdFx0XHQnU2VjdXJpdHlJRCc6IHRoaXMucHJvcHMuc3VtbWFyeS5TZWN1cml0eUlEXG5cdFx0XHR9XG5cdFx0fSkpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0d2luZG93LmxvY2F0aW9uID0gZGF0YS51cmw7XG5cdFx0fSwgZnVuY3Rpb24oZGF0YSl7XG5cdFx0XHRjb25zb2xlLmVycm9yKGRhdGEpO1xuXHRcdH0pO1xuXHR9LFxuXHRtb3VzZUVudGVySGFuZGxlcjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtkZXBsb3lIb3ZlcjogdHJ1ZX0pO1xuXHR9LFxuXHRtb3VzZUxlYXZlSGFuZGxlcjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtkZXBsb3lIb3ZlcjogZmFsc2V9KTtcblx0fSxcblx0Y2FuRGVwbG95OiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKHRoaXMucHJvcHMuc3VtbWFyeS52YWxpZGF0aW9uQ29kZT09PVwic3VjY2Vzc1wiIHx8IHRoaXMucHJvcHMuc3VtbWFyeS52YWxpZGF0aW9uQ29kZT09PVwid2FybmluZ1wiKTtcblx0fSxcblx0aXNFbXB0eTogZnVuY3Rpb24ob2JqKSB7XG5cdFx0Zm9yICh2YXIga2V5IGluIG9iaikge1xuXHRcdFx0aWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIG9ialtrZXldKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHRydWU7XG5cdH0sXG5cdHNob3dOb0NoYW5nZXNNZXNzYWdlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc3VtbWFyeSA9IHRoaXMucHJvcHMuc3VtbWFyeTtcblx0XHRpZihzdW1tYXJ5LmluaXRpYWxTdGF0ZSA9PT0gdHJ1ZSkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0XHRpZihzdW1tYXJ5Lm1lc3NhZ2VzID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiAodGhpcy5pc0VtcHR5KHN1bW1hcnkuY2hhbmdlcykgJiYgc3VtbWFyeS5tZXNzYWdlcy5sZW5ndGggPT09IDApO1xuXHR9LFxuXHRhY3Rpb25UaXRsZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGFjdGlvblRpdGxlID0gdGhpcy5wcm9wcy5zdW1tYXJ5LmFjdGlvblRpdGxlO1xuXHRcdGlmICh0eXBlb2YgYWN0aW9uVGl0bGUgPT09ICd1bmRlZmluZWQnIHx8IGFjdGlvblRpdGxlID09PSAnJyApIHtcblx0XHRcdHJldHVybiAnTWFrZSBhIHNlbGVjdGlvbic7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnByb3BzLnN1bW1hcnkuYWN0aW9uVGl0bGU7XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG1lc3NhZ2VzID0gdGhpcy5wcm9wcy5zdW1tYXJ5Lm1lc3NhZ2VzO1xuXHRcdGlmICh0aGlzLnNob3dOb0NoYW5nZXNNZXNzYWdlKCkpIHtcblx0XHRcdG1lc3NhZ2VzID0gW3tcblx0XHRcdFx0dGV4dDogXCJUaGVyZSBhcmUgbm8gY2hhbmdlcyBidXQgeW91IGNhbiBkZXBsb3kgYW55d2F5IGlmIHlvdSB3aXNoLlwiLFxuXHRcdFx0XHRjb2RlOiBcInN1Y2Nlc3NcIlxuXHRcdFx0fV07XG5cdFx0fVxuXG5cdFx0dmFyIGRlcGxveUFjdGlvbjtcblx0XHRpZih0aGlzLmNhbkRlcGxveSgpKSB7XG5cdFx0XHRkZXBsb3lBY3Rpb24gPSAoXG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VjdGlvblwiXG5cdFx0XHRcdFx0b25Nb3VzZUVudGVyPXt0aGlzLm1vdXNlRW50ZXJIYW5kbGVyfVxuXHRcdFx0XHRcdG9uTW91c2VMZWF2ZT17dGhpcy5tb3VzZUxlYXZlSGFuZGxlcn0+XG5cdFx0XHRcdFx0XHQ8YnV0dG9uXG5cdFx0XHRcdFx0XHRcdHZhbHVlPVwiQ29uZmlybSBEZXBsb3ltZW50XCJcblx0XHRcdFx0XHRcdFx0Y2xhc3NOYW1lPVwiZGVwbG95IHB1bGwtbGVmdFwiXG5cdFx0XHRcdFx0XHRcdGRpc2FibGVkPXt0aGlzLnN0YXRlLmRlcGxveV9kaXNhYmxlZH1cblx0XHRcdFx0XHRcdFx0b25DbGljaz17dGhpcy5kZXBsb3lIYW5kbGVyfT5cblx0XHRcdFx0XHRcdFx0e3RoaXMuYWN0aW9uVGl0bGUoKX1cblx0XHRcdFx0XHRcdDwvYnV0dG9uPlxuXHRcdFx0XHRcdFx0PFF1aWNrU3VtbWFyeSBhY3RpdmF0ZWQ9e3RoaXMuc3RhdGUuZGVwbG95SG92ZXJ9IGNvbnRleHQ9e3RoaXMucHJvcHMuY29udGV4dH0gc3VtbWFyeT17dGhpcy5wcm9wcy5zdW1tYXJ5fSAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0dmFyIGhlYWRlckNsYXNzZXMgPSBIZWxwZXJzLmNsYXNzTmFtZXMoe1xuXHRcdFx0aGVhZGVyOiB0cnVlLFxuXHRcdFx0aW5hY3RpdmU6ICF0aGlzLmNhbkRlcGxveSgpLFxuXHRcdFx0bG9hZGluZzogdGhpcy5zdGF0ZS5sb2FkaW5nX2NoYW5nZXNcblx0XHR9KTtcblxuXHRcdHJldHVybihcblx0XHRcdDxkaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VjdGlvblwiPlxuXHRcdFx0XHRcdDxkaXYgY2xhc3NOYW1lPXtoZWFkZXJDbGFzc2VzfT5cblx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cInN0YXR1cy1pY29uXCI+PC9zcGFuPlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwibnVtYmVyQ2lyY2xlXCI+Mjwvc3Bhbj4gUmV2aWV3IGNoYW5nZXNcblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHQ8TWVzc2FnZUxpc3QgbWVzc2FnZXM9e21lc3NhZ2VzfSAvPlxuXHRcdFx0XHRcdDxTdW1tYXJ5VGFibGUgY2hhbmdlcz17dGhpcy5wcm9wcy5zdW1tYXJ5LmNoYW5nZXN9IC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHR7ZGVwbG95QWN0aW9ufVxuXHRcdFx0PC9kaXY+XG5cdFx0KVxuXHR9XG59KTtcblxudmFyIFF1aWNrU3VtbWFyeSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdHlwZSA9ICh0aGlzLnByb3BzLnN1bW1hcnkuYWN0aW9uQ29kZT09PSdmYXN0JyA/ICdjb2RlLW9ubHknIDogJ2Z1bGwnKTtcblx0XHR2YXIgZXN0aW1hdGUgPSBbXTtcblx0XHRpZiAodGhpcy5wcm9wcy5zdW1tYXJ5LmVzdGltYXRlZFRpbWUgJiYgdGhpcy5wcm9wcy5zdW1tYXJ5LmVzdGltYXRlZFRpbWU+MCkge1xuXHRcdFx0ZXN0aW1hdGUgPSBbXG5cdFx0XHRcdDxkdD5EdXJhdGlvbjo8L2R0Pixcblx0XHRcdFx0PGRkPnt0aGlzLnByb3BzLnN1bW1hcnkuZXN0aW1hdGVkVGltZX0gbWluIGFwcHJveC48L2RkPlxuXHRcdFx0XTtcblx0XHR9XG5cblx0XHR2YXIgZGxDbGFzc2VzID0gSGVscGVycy5jbGFzc05hbWVzKHtcblx0XHRcdGFjdGl2YXRlZDogdGhpcy5wcm9wcy5hY3RpdmF0ZWQsXG5cdFx0XHQncXVpY2stc3VtbWFyeSc6IHRydWVcblx0XHR9KTtcblxuXHRcdHZhciBtb3JlSW5mbyA9IG51bGw7XG5cdFx0aWYgKHR5cGVvZiB0aGlzLnByb3BzLmNvbnRleHQuZGVwbG95SGVscCE9PSd1bmRlZmluZWQnICYmIHRoaXMucHJvcHMuY29udGV4dC5kZXBsb3lIZWxwKSB7XG5cdFx0XHRtb3JlSW5mbyA9IChcblx0XHRcdFx0PGEgdGFyZ2V0PVwiX2JsYW5rXCIgY2xhc3NOYW1lPVwic21hbGxcIiBocmVmPXt0aGlzLnByb3BzLmNvbnRleHQuZGVwbG95SGVscH0+bW9yZSBpbmZvPC9hPlxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5wcm9wcy5jb250ZXh0LnNpdGVVcmwpIHtcblx0XHRcdHZhciBlbnYgPSA8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPXt0aGlzLnByb3BzLmNvbnRleHQuc2l0ZVVybH0+e3RoaXMucHJvcHMuY29udGV4dC5lbnZOYW1lfTwvYT47XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBlbnYgPSA8c3Bhbj57dGhpcy5wcm9wcy5jb250ZXh0LmVudk5hbWV9PC9zcGFuPjtcblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRsIGNsYXNzTmFtZT17ZGxDbGFzc2VzfT5cblx0XHRcdFx0PGR0PkVudmlyb25tZW50OjwvZHQ+XG5cdFx0XHRcdDxkZD57ZW52fTwvZGQ+XG5cdFx0XHRcdDxkdD5EZXBsb3kgdHlwZTo8L2R0PlxuXHRcdFx0XHQ8ZGQ+e3R5cGV9IHttb3JlSW5mb308L2RkPlxuXHRcdFx0XHR7ZXN0aW1hdGV9XG5cdFx0XHQ8L2RsPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgTWVzc2FnZUxpc3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0aWYodGhpcy5wcm9wcy5tZXNzYWdlcy5sZW5ndGggPCAxKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdFx0aWYodHlwZW9mIHRoaXMucHJvcHMubWVzc2FnZXMgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdFx0dmFyIGlkeCA9IDA7XG5cdFx0dmFyIG1lc3NhZ2VzID0gdGhpcy5wcm9wcy5tZXNzYWdlcy5tYXAoZnVuY3Rpb24obWVzc2FnZSkge1xuXHRcdFx0aWR4Kys7XG5cdFx0XHRyZXR1cm4gPE1lc3NhZ2Uga2V5PXtpZHh9IG1lc3NhZ2U9e21lc3NhZ2V9IC8+XG5cdFx0fSk7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXY+XG5cdFx0XHRcdHttZXNzYWdlc31cblx0XHRcdDwvZGl2PlxuXHRcdClcblx0fVxufSk7XG5cbnZhciBNZXNzYWdlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjbGFzc01hcCA9IHtcblx0XHRcdCdlcnJvcic6ICdhbGVydCBhbGVydC1kYW5nZXInLFxuXHRcdFx0J3dhcm5pbmcnOiAnYWxlcnQgYWxlcnQtd2FybmluZycsXG5cdFx0XHQnc3VjY2Vzcyc6ICdhbGVydCBhbGVydC1pbmZvJ1xuXHRcdH07XG5cdFx0dmFyIGNsYXNzbmFtZT1jbGFzc01hcFt0aGlzLnByb3BzLm1lc3NhZ2UuY29kZV07XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPXtjbGFzc25hbWV9IHJvbGU9XCJhbGVydFwiXG5cdFx0XHRcdGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7X19odG1sOiB0aGlzLnByb3BzLm1lc3NhZ2UudGV4dH19IC8+XG5cdFx0KVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEZXBsb3lQbGFuO1xuIiwidmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XG52YXIgSGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycy5qcycpO1xudmFyIERlcGxveVBsYW4gPSByZXF1aXJlKCcuL2RlcGxveV9wbGFuLmpzeCcpO1xuXG52YXIgRGVwbG95bWVudERpYWxvZyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblxuXHRsb2FkaW5nU3ViOiBudWxsLFxuXG5cdGxvYWRpbmdEb25lU3ViOiBudWxsLFxuXG5cdGVycm9yU3ViOiBudWxsLFxuXG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGxvYWRpbmc6IGZhbHNlLFxuXHRcdFx0bG9hZGluZ1RleHQ6IFwiXCIsXG5cdFx0XHRlcnJvclRleHQ6IFwiXCIsXG5cdFx0XHRmZXRjaGVkOiB0cnVlLFxuXHRcdFx0bGFzdF9mZXRjaGVkOiBcIlwiXG5cdFx0fTtcblx0fSxcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHQvLyBhZGQgc3Vic2NyaWJlcnNcblx0XHR0aGlzLmxvYWRpbmdTdWIgPSBFdmVudHMuc3Vic2NyaWJlKCdsb2FkaW5nJywgZnVuY3Rpb24odGV4dCkge1xuXHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdGxvYWRpbmc6IHRydWUsXG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlLFxuXHRcdFx0XHRsb2FkaW5nVGV4dDogdGV4dFxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdFx0dGhpcy5sb2FkaW5nRG9uZVN1YiA9IEV2ZW50cy5zdWJzY3JpYmUoJ2xvYWRpbmcvZG9uZScsIGZ1bmN0aW9uKCkge1xuXHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdGxvYWRpbmc6IGZhbHNlLFxuXHRcdFx0XHRsb2FkaW5nVGV4dDogJycsXG5cdFx0XHRcdHN1Y2Nlc3M6IHRydWVcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdHRoaXMuZXJyb3JTdWIgPSBFdmVudHMuc3Vic2NyaWJlKCdlcnJvcicsIGZ1bmN0aW9uKHRleHQpIHtcblx0XHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0XHRlcnJvclRleHQ6IHRleHQsXG5cdFx0XHRcdGxvYWRpbmc6IGZhbHNlLFxuXHRcdFx0XHRsb2FkaW5nVGV4dDogJycsXG5cdFx0XHRcdHN1Y2Nlc3M6IGZhbHNlXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fSxcblx0Y29tcG9uZW50V2lsbFVubW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIHJlbW92ZSBzdWJzY3JpYmVyc1xuXHRcdHRoaXMubG9hZGluZ1N1Yi5yZW1vdmUoKTtcblx0XHR0aGlzLmxvYWRpbmdEb25lU3ViLnJlbW92ZSgpO1xuXHRcdHRoaXMuZXJyb3JTdWIucmVtb3ZlKCk7XG5cdH0sXG5cdGhhbmRsZUNsaWNrOiBmdW5jdGlvbihlKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdEV2ZW50cy5wdWJsaXNoKCdsb2FkaW5nJywgXCJGZXRjaGluZyBsYXRlc3QgY29kZeKAplwiKTtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGZldGNoZWQ6IGZhbHNlXG5cdFx0fSk7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdFEoJC5hamF4KHtcblx0XHRcdHR5cGU6IFwiUE9TVFwiLFxuXHRcdFx0ZGF0YVR5cGU6ICdqc29uJyxcblx0XHRcdHVybDogdGhpcy5wcm9wcy5jb250ZXh0LnByb2plY3RVcmwgKyAnL2ZldGNoJ1xuXHRcdH0pKVxuXHRcdFx0LnRoZW4odGhpcy53YWl0Rm9yRmV0Y2hUb0NvbXBsZXRlLCB0aGlzLmZldGNoU3RhdHVzRXJyb3IpXG5cdFx0XHQudGhlbihmdW5jdGlvbigpIHtcblx0XHRcdFx0RXZlbnRzLnB1Ymxpc2goJ2xvYWRpbmcvZG9uZScpO1xuXHRcdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0XHRmZXRjaGVkOiB0cnVlXG5cdFx0XHRcdH0pXG5cdFx0XHR9KS5jYXRjaCh0aGlzLmZldGNoU3RhdHVzRXJyb3IpLmRvbmUoKTtcblx0fSxcblx0d2FpdEZvckZldGNoVG9Db21wbGV0ZTpmdW5jdGlvbiAoZmV0Y2hEYXRhKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHJldHVybiB0aGlzLmdldEZldGNoU3RhdHVzKGZldGNoRGF0YSkudGhlbihmdW5jdGlvbiAoZGF0YSkge1xuXHRcdFx0aWYgKGRhdGEuc3RhdHVzID09PSBcIkNvbXBsZXRlXCIpIHtcblx0XHRcdFx0cmV0dXJuIGRhdGE7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZGF0YS5zdGF0dXMgPT09IFwiRmFpbGVkXCIpIHtcblx0XHRcdFx0cmV0dXJuICQuRGVmZXJyZWQoZnVuY3Rpb24gKGQpIHtcblx0XHRcdFx0XHRyZXR1cm4gZC5yZWplY3QoZGF0YSk7XG5cdFx0XHRcdH0pLnByb21pc2UoKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBzZWxmLndhaXRGb3JGZXRjaFRvQ29tcGxldGUoZmV0Y2hEYXRhKTtcblx0XHR9KTtcblx0fSxcblx0Z2V0RmV0Y2hTdGF0dXM6IGZ1bmN0aW9uIChmZXRjaERhdGEpIHtcblx0XHRyZXR1cm4gUSgkLmFqYXgoe1xuXHRcdFx0dHlwZTogXCJHRVRcIixcblx0XHRcdHVybDogZmV0Y2hEYXRhLmhyZWYsXG5cdFx0XHRkYXRhVHlwZTogJ2pzb24nXG5cdFx0fSkpO1xuXHR9LFxuXHRmZXRjaFN0YXR1c0Vycm9yOiBmdW5jdGlvbihkYXRhKSB7XG5cdFx0dmFyIG1lc3NhZ2UgID0gJ1Vua25vd24gZXJyb3InO1xuXHRcdGlmKHR5cGVvZiBkYXRhLnJlc3BvbnNlVGV4dCAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdG1lc3NhZ2UgPSBkYXRhLnJlc3BvbnNlVGV4dDtcblx0XHR9IGVsc2UgaWYgKHR5cGVvZiBkYXRhLm1lc3NhZ2UgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRtZXNzYWdlID0gZGF0YS5tZXNzYWdlO1xuXHRcdH1cblx0XHRFdmVudHMucHVibGlzaCgnZXJyb3InLCBtZXNzYWdlKTtcblx0fSxcblx0bGFzdEZldGNoZWRIYW5kbGVyOiBmdW5jdGlvbih0aW1lX2Fnbykge1xuXHRcdHRoaXMuc2V0U3RhdGUoe2xhc3RfZmV0Y2hlZDogdGltZV9hZ299KTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG5cdFx0XHRcImRlcGxveS1kcm9wZG93blwiOiB0cnVlLFxuXHRcdFx0XCJsb2FkaW5nXCI6IHRoaXMuc3RhdGUubG9hZGluZyxcblx0XHRcdFwic3VjY2Vzc1wiOiB0aGlzLnN0YXRlLnN1Y2Nlc3Ncblx0XHR9KTtcblxuXHRcdHZhciBmb3JtO1xuXG5cdFx0aWYodGhpcy5zdGF0ZS5lcnJvclRleHQgIT09IFwiXCIpIHtcblx0XHRcdGZvcm0gPSA8RXJyb3JNZXNzYWdlcyBtZXNzYWdlPXt0aGlzLnN0YXRlLmVycm9yVGV4dH0gLz5cblx0XHR9IGVsc2UgaWYodGhpcy5zdGF0ZS5mZXRjaGVkKSB7XG5cdFx0XHRmb3JtID0gPERlcGxveUZvcm0gY29udGV4dD17dGhpcy5wcm9wcy5jb250ZXh0fSBkYXRhPXt0aGlzLnByb3BzLmRhdGF9IGxhc3RGZXRjaGVkSGFuZGxlcj17dGhpcy5sYXN0RmV0Y2hlZEhhbmRsZXJ9IC8+XG5cdFx0fSBlbHNlIGlmICh0aGlzLnN0YXRlLmxvYWRpbmcpIHtcblx0XHRcdGZvcm0gPSA8TG9hZGluZ0RlcGxveUZvcm0gbWVzc2FnZT1cIkZldGNoaW5nIGxhdGVzdCBjb2RlJmhlbGxpcDtcIiAvPlxuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT17Y2xhc3Nlc30gb25DbGljaz17dGhpcy5oYW5kbGVDbGlja30+XG5cdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwic3RhdHVzLWljb25cIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L3NwYW4+XG5cdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwidGltZVwiPmxhc3QgdXBkYXRlZCB7dGhpcy5zdGF0ZS5sYXN0X2ZldGNoZWR9PC9zcGFuPlxuXHRcdFx0XHRcdDxFbnZpcm9ubWVudE5hbWUgZW52aXJvbm1lbnROYW1lPXt0aGlzLnByb3BzLmNvbnRleHQuZW52TmFtZX0gLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdHtmb3JtfVxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBMb2FkaW5nRGVwbG95Rm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJkZXBsb3ktZm9ybS1sb2FkaW5nXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiaWNvbi1ob2xkZXJcIj5cblx0XHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1jb2cgZmEtc3BpblwiPjwvaT5cblx0XHRcdFx0XHQ8c3Bhbj57dGhpcy5wcm9wcy5tZXNzYWdlfTwvc3Bhbj5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIEVycm9yTWVzc2FnZXMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZGVwbG95LWRyb3Bkb3duLWVycm9yc1wiPlxuXHRcdFx0XHR7dGhpcy5wcm9wcy5tZXNzYWdlfVxuXHRcdFx0PC9kaXY+XG5cdFx0KVxuXHR9XG59KTtcblxuLyoqXG4gKiBFbnZpcm9ubWVudE5hbWVcbiAqL1xudmFyIEVudmlyb25tZW50TmFtZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cImVudmlyb25tZW50LW5hbWVcIj5cblx0XHRcdFx0PGkgY2xhc3NOYW1lPVwiZmEgZmEtcm9ja2V0XCI+Jm5ic3A7PC9pPlxuXHRcdFx0XHREZXBsb3ltZW50IG9wdGlvbnMgPHNwYW4gY2xhc3NOYW1lPVwiaGlkZGVuLXhzXCI+Zm9yIHt0aGlzLnByb3BzLmVudmlyb25tZW50TmFtZX08L3NwYW4+XG5cdFx0XHQ8L3NwYW4+XG5cdFx0KTtcblx0fVxufSk7XG5cbi8qKlxuICogRGVwbG95Rm9ybVxuICovXG52YXIgRGVwbG95Rm9ybSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c2VsZWN0ZWRUYWI6IDEsXG5cdFx0XHRkYXRhOiBbXVxuXHRcdH07XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmdpdERhdGEoKTtcblx0fSxcblxuXHRnaXREYXRhOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRsb2FkaW5nOiB0cnVlXG5cdFx0fSk7XG5cdFx0USgkLmFqYXgoe1xuXHRcdFx0dHlwZTogXCJQT1NUXCIsXG5cdFx0XHRkYXRhVHlwZTogJ2pzb24nLFxuXHRcdFx0dXJsOiB0aGlzLnByb3BzLmNvbnRleHQuZW52VXJsICsgJy9naXRfcmV2aXNpb25zJ1xuXHRcdH0pKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0XHRsb2FkaW5nOiBmYWxzZSxcblx0XHRcdFx0ZGF0YTogZGF0YS5UYWJzXG5cdFx0XHR9KTtcblx0XHRcdHNlbGYucHJvcHMubGFzdEZldGNoZWRIYW5kbGVyKGRhdGEubGFzdF9mZXRjaGVkKTtcblx0XHR9LCBmdW5jdGlvbihkYXRhKXtcblx0XHRcdEV2ZW50cy5wdWJsaXNoKCdlcnJvcicsIGRhdGEpO1xuXHRcdH0pO1xuXHR9LFxuXG5cdHNlbGVjdEhhbmRsZXI6IGZ1bmN0aW9uKGlkKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7c2VsZWN0ZWRUYWI6IGlkfSk7XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdGlmKHRoaXMuc3RhdGUubG9hZGluZykge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0PExvYWRpbmdEZXBsb3lGb3JtIG1lc3NhZ2U9XCJMb2FkaW5nJmhlbGxpcDtcIiAvPlxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJkZXBsb3ktZm9ybS1vdXRlciBjbGVhcmZpeFwiPlxuXHRcdFx0XHQ8Zm9ybSBjbGFzc05hbWU9XCJmb3JtLWlubGluZSBkZXBsb3ktZm9ybVwiIGFjdGlvbj1cIlBPU1RcIiBhY3Rpb249XCIjXCI+XG5cdFx0XHRcdFx0PERlcGxveVRhYlNlbGVjdG9yIGRhdGE9e3RoaXMuc3RhdGUuZGF0YX0gb25TZWxlY3Q9e3RoaXMuc2VsZWN0SGFuZGxlcn0gc2VsZWN0ZWRUYWI9e3RoaXMuc3RhdGUuc2VsZWN0ZWRUYWJ9IC8+XG5cdFx0XHRcdFx0PERlcGxveVRhYnMgY29udGV4dD17dGhpcy5wcm9wcy5jb250ZXh0fSBkYXRhPXt0aGlzLnN0YXRlLmRhdGF9IHNlbGVjdGVkVGFiPXt0aGlzLnN0YXRlLnNlbGVjdGVkVGFifSBTZWN1cml0eVRva2VuPXt0aGlzLnN0YXRlLlNlY3VyaXR5VG9rZW59IC8+XG5cdFx0XHRcdDwvZm9ybT5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG4vKipcbiAqIERlcGxveVRhYlNlbGVjdG9yXG4gKi9cbnZhciBEZXBsb3lUYWJTZWxlY3RvciA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciBzZWxlY3RvcnMgPSB0aGlzLnByb3BzLmRhdGEubWFwKGZ1bmN0aW9uKHRhYikge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0PERlcGxveVRhYlNlbGVjdCBrZXk9e3RhYi5pZH0gdGFiPXt0YWJ9IG9uU2VsZWN0PXtzZWxmLnByb3BzLm9uU2VsZWN0fSBzZWxlY3RlZFRhYj17c2VsZi5wcm9wcy5zZWxlY3RlZFRhYn0gLz5cblx0XHRcdCk7XG5cdFx0fSk7XG5cdFx0cmV0dXJuIChcblx0XHRcdDx1bCBjbGFzc05hbWU9XCJTZWxlY3Rpb25Hcm91cCB0YWJiZWRzZWxlY3Rpb25ncm91cCBub2xhYmVsXCI+XG5cdFx0XHRcdHtzZWxlY3RvcnN9XG5cdFx0XHQ8L3VsPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG4vKipcbiAqIERlcGxveVRhYlNlbGVjdFxuICovXG52YXIgRGVwbG95VGFiU2VsZWN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRoYW5kbGVDbGljazogZnVuY3Rpb24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHR0aGlzLnByb3BzLm9uU2VsZWN0KHRoaXMucHJvcHMudGFiLmlkKVxuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgY2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG5cdFx0XHRcImFjdGl2ZVwiIDogKHRoaXMucHJvcHMuc2VsZWN0ZWRUYWIgPT0gdGhpcy5wcm9wcy50YWIuaWQpXG5cdFx0fSk7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxsaSBjbGFzc05hbWU9e2NsYXNzZXN9PlxuXHRcdFx0XHQ8YSBvbkNsaWNrPXt0aGlzLmhhbmRsZUNsaWNrfSBocmVmPXtcIiNkZXBsb3ktdGFiLVwiK3RoaXMucHJvcHMudGFiLmlkfSA+e3RoaXMucHJvcHMudGFiLm5hbWV9PC9hPlxuXHRcdFx0PC9saT5cblx0XHQpO1xuXHR9XG5cbn0pO1xuXG4vKipcbiAqIERlcGxveVRhYnNcbiAqL1xudmFyIERlcGxveVRhYnMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgdGFicyA9IHRoaXMucHJvcHMuZGF0YS5tYXAoZnVuY3Rpb24odGFiKSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQ8RGVwbG95VGFiIGNvbnRleHQ9e3NlbGYucHJvcHMuY29udGV4dH0ga2V5PXt0YWIuaWR9IHRhYj17dGFifSBzZWxlY3RlZFRhYj17c2VsZi5wcm9wcy5zZWxlY3RlZFRhYn0gU2VjdXJpdHlUb2tlbj17c2VsZi5wcm9wcy5TZWN1cml0eVRva2VufSAvPlxuXHRcdFx0KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInRhYi1jb250ZW50XCI+XG5cdFx0XHRcdHt0YWJzfVxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbi8qKlxuICogRGVwbG95VGFiXG4gKi9cbnZhciBEZXBsb3lUYWIgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHN1bW1hcnk6IHRoaXMuZ2V0SW5pdGlhbFN1bW1hcnlTdGF0ZSgpLFxuXHRcdFx0b3B0aW9uczoge30sXG5cdFx0XHRzaGE6ICcnXG5cdFx0fTtcblx0fSxcblx0Z2V0SW5pdGlhbFN1bW1hcnlTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGNoYW5nZXM6IHt9LFxuXHRcdFx0bWVzc2FnZXM6IFtdLFxuXHRcdFx0dmFsaWRhdGlvbkNvZGU6ICcnLFxuXHRcdFx0ZXN0aW1hdGVkVGltZTogbnVsbCxcblx0XHRcdGFjdGlvbkNvZGU6IG51bGwsXG5cdFx0XHRpbml0aWFsU3RhdGU6IHRydWVcblx0XHR9XG5cdH0sXG5cdE9wdGlvbkNoYW5nZUhhbmRsZXI6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIG9wdGlvbnMgPSB0aGlzLnN0YXRlLm9wdGlvbnM7XG5cdFx0b3B0aW9uc1tldmVudC50YXJnZXQubmFtZV0gPSBldmVudC50YXJnZXQuY2hlY2tlZDtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdG9wdGlvbnM6IG9wdGlvbnNcblx0XHR9KTtcblx0fSxcblx0U0hBQ2hhbmdlSGFuZGxlcjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdHNoYTogZXZlbnQudGFyZ2V0LnZhbHVlXG5cdFx0fSk7XG5cdH0sXG5cdGNoYW5nZUhhbmRsZXI6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0c3VtbWFyeTogdGhpcy5nZXRJbml0aWFsU3VtbWFyeVN0YXRlKClcblx0XHR9KTtcblxuXHRcdGlmKGV2ZW50LnRhcmdldC52YWx1ZSA9PT0gXCJcIikge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdEV2ZW50cy5wdWJsaXNoKCdjaGFuZ2VfbG9hZGluZycpO1xuXG5cdFx0dmFyIHN1bW1hcnlEYXRhID0ge1xuXHRcdFx0c2hhOiBSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuc2hhX3NlbGVjdG9yLnJlZnMuc2hhKS52YWx1ZSxcblx0XHRcdFNlY3VyaXR5SUQ6IHRoaXMucHJvcHMuU2VjdXJpdHlUb2tlblxuXHRcdH07XG5cdFx0Ly8gbWVyZ2UgdGhlICdhZHZhbmNlZCcgb3B0aW9ucyBpZiB0aGV5IGFyZSBzZXRcblx0XHRmb3IgKHZhciBhdHRybmFtZSBpbiB0aGlzLnN0YXRlLm9wdGlvbnMpIHtcblx0XHRcdGlmKHRoaXMuc3RhdGUub3B0aW9ucy5oYXNPd25Qcm9wZXJ0eShhdHRybmFtZSkpIHtcblx0XHRcdFx0c3VtbWFyeURhdGFbYXR0cm5hbWVdID0gdGhpcy5zdGF0ZS5vcHRpb25zW2F0dHJuYW1lXTtcblx0XHRcdH1cblx0XHR9XG5cdFx0USgkLmFqYXgoe1xuXHRcdFx0dHlwZTogXCJQT1NUXCIsXG5cdFx0XHRkYXRhVHlwZTogJ2pzb24nLFxuXHRcdFx0dXJsOiB0aGlzLnByb3BzLmNvbnRleHQuZW52VXJsICsgJy9kZXBsb3lfc3VtbWFyeScsXG5cdFx0XHRkYXRhOiBzdW1tYXJ5RGF0YVxuXHRcdH0pKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0XHRzdW1tYXJ5OiBkYXRhXG5cdFx0XHR9KTtcblx0XHRcdEV2ZW50cy5wdWJsaXNoKCdjaGFuZ2VfbG9hZGluZy9kb25lJyk7XG5cdFx0fS5iaW5kKHRoaXMpLCBmdW5jdGlvbigpe1xuXHRcdFx0RXZlbnRzLnB1Ymxpc2goJ2NoYW5nZV9sb2FkaW5nL2RvbmUnKTtcblx0XHR9KTtcblx0fSxcblxuXHRzaG93T3B0aW9uczogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMucHJvcHMudGFiLmFkdmFuY2VkX29wdHMgPT09ICd0cnVlJztcblx0fSxcblxuXHRzaG93VmVyaWZ5QnV0dG9uOiBmdW5jdGlvbigpIHtcblx0XHRpZih0aGlzLnNob3dPcHRpb25zKCkpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5wcm9wcy50YWIuZmllbGRfdHlwZSA9PSAndGV4dGZpZWxkJztcblx0fSxcblxuXHRzaGFDaG9zZW46IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAodGhpcy5zdGF0ZS5zaGEgIT09ICcnKTtcblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgY2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG5cdFx0XHRcInRhYi1wYW5lXCI6IHRydWUsXG5cdFx0XHRcImNsZWFyZml4XCI6IHRydWUsXG5cdFx0XHRcImFjdGl2ZVwiIDogKHRoaXMucHJvcHMuc2VsZWN0ZWRUYWIgPT0gdGhpcy5wcm9wcy50YWIuaWQpXG5cdFx0fSk7XG5cblx0XHQvLyBzZXR1cCB0aGUgZHJvcGRvd24gb3IgdGhlIHRleHQgaW5wdXQgZm9yIHNlbGVjdGluZyBhIFNIQVxuXHRcdHZhciBzZWxlY3Rvcjtcblx0XHRpZiAodGhpcy5wcm9wcy50YWIuZmllbGRfdHlwZSA9PSAnZHJvcGRvd24nKSB7XG5cdFx0XHR2YXIgY2hhbmdlSGFuZGxlciA9IHRoaXMuY2hhbmdlSGFuZGxlcjtcblx0XHRcdGlmKHRoaXMuc2hvd1ZlcmlmeUJ1dHRvbigpKSB7IGNoYW5nZUhhbmRsZXIgPSB0aGlzLlNIQUNoYW5nZUhhbmRsZXIgfVxuXHRcdFx0c2VsZWN0b3IgPSA8U2VsZWN0b3JEcm9wZG93biByZWY9XCJzaGFfc2VsZWN0b3JcIiB0YWI9e3RoaXMucHJvcHMudGFifSBjaGFuZ2VIYW5kbGVyPXtjaGFuZ2VIYW5kbGVyfSAvPlxuXHRcdH0gZWxzZSBpZiAodGhpcy5wcm9wcy50YWIuZmllbGRfdHlwZSA9PSAndGV4dGZpZWxkJykge1xuXHRcdFx0c2VsZWN0b3IgPSA8U2VsZWN0b3JUZXh0IHJlZj1cInNoYV9zZWxlY3RvclwiIHRhYj17dGhpcy5wcm9wcy50YWJ9IGNoYW5nZUhhbmRsZXI9e3RoaXMuU0hBQ2hhbmdlSGFuZGxlcn0gLz5cblx0XHR9XG5cblx0XHQvLyAnQWR2YW5jZWQnIG9wdGlvbnNcblx0XHR2YXIgb3B0aW9ucyA9IG51bGw7XG5cdFx0aWYodGhpcy5zaG93T3B0aW9ucygpKSB7XG5cdFx0XHRvcHRpb25zID0gPEFkdmFuY2VkT3B0aW9ucyB0YWI9e3RoaXMucHJvcHMudGFifSBjaGFuZ2VIYW5kbGVyPXt0aGlzLk9wdGlvbkNoYW5nZUhhbmRsZXJ9IC8+XG5cdFx0fVxuXG5cdFx0Ly8gJ1RoZSB2ZXJpZnkgYnV0dG9uJ1xuXHRcdHZhciB2ZXJpZnlCdXR0b24gPSBudWxsO1xuXHRcdGlmKHRoaXMuc2hvd1ZlcmlmeUJ1dHRvbigpKSB7XG5cdFx0XHR2ZXJpZnlCdXR0b24gPSA8VmVyaWZ5QnV0dG9uIGRpc2FibGVkPXshdGhpcy5zaGFDaG9zZW4oKX0gY2hhbmdlSGFuZGxlcj17dGhpcy5jaGFuZ2VIYW5kbGVyfSAvPlxuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGlkPXtcImRlcGxveS10YWItXCIrdGhpcy5wcm9wcy50YWIuaWR9IGNsYXNzTmFtZT17Y2xhc3Nlc30+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwic2VjdGlvblwiPlxuXHRcdFx0XHRcdDxkaXYgaHRtbEZvcj17dGhpcy5wcm9wcy50YWIuZmllbGRfaWR9IGNsYXNzTmFtZT1cImhlYWRlclwiPlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwibnVtYmVyQ2lyY2xlXCI+MTwvc3Bhbj4ge3RoaXMucHJvcHMudGFiLmZpZWxkX2xhYmVsfVxuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdHtzZWxlY3Rvcn1cblx0XHRcdFx0XHR7b3B0aW9uc31cblx0XHRcdFx0XHR7dmVyaWZ5QnV0dG9ufVxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PERlcGxveVBsYW4gY29udGV4dD17dGhpcy5wcm9wcy5jb250ZXh0fSBzdW1tYXJ5PXt0aGlzLnN0YXRlLnN1bW1hcnl9IC8+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIFNlbGVjdG9yRHJvcGRvd24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHQkKFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5zaGEpKS5zZWxlY3QyKHtcblx0XHRcdC8vIExvYWQgZGF0YSBpbnRvIHRoZSBzZWxlY3QyLlxuXHRcdFx0Ly8gVGhlIGZvcm1hdCBzdXBwb3J0cyBvcHRncm91cHMsIGFuZCBsb29rcyBsaWtlIHRoaXM6XG5cdFx0XHQvLyBbe3RleHQ6ICdvcHRncm91cCB0ZXh0JywgY2hpbGRyZW46IFt7aWQ6ICc8c2hhPicsIHRleHQ6ICc8aW5uZXIgdGV4dD4nfV19XVxuXHRcdFx0ZGF0YTogdGhpcy5wcm9wcy50YWIuZmllbGRfZGF0YVxuXHRcdH0pO1xuXG5cdFx0Ly8gVHJpZ2dlciBoYW5kbGVyIG9ubHkgbmVlZGVkIGlmIHRoZXJlIGlzIG5vIGV4cGxpY2l0IGJ1dHRvbi5cblx0XHRpZih0aGlzLnByb3BzLmNoYW5nZUhhbmRsZXIpIHtcblx0XHRcdCQoUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLnNoYSkpLnNlbGVjdDIoKS5vbihcImNoYW5nZVwiLCB0aGlzLnByb3BzLmNoYW5nZUhhbmRsZXIpO1xuXHRcdH1cblx0fSxcblxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdC8vIEZyb20gaHR0cHM6Ly9zZWxlY3QyLmdpdGh1Yi5pby9leGFtcGxlcy5odG1sIFwiVGhlIGJlc3Qgd2F5IHRvIGVuc3VyZSB0aGF0IFNlbGVjdDIgaXMgdXNpbmcgYSBwZXJjZW50IGJhc2VkXG5cdFx0Ly8gd2lkdGggaXMgdG8gaW5saW5lIHRoZSBzdHlsZSBkZWNsYXJhdGlvbiBpbnRvIHRoZSB0YWdcIi5cblx0XHR2YXIgc3R5bGUgPSB7d2lkdGg6ICcxMDAlJ307XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmaWVsZFwiPlxuXHRcdFx0XHRcdDxzZWxlY3Rcblx0XHRcdFx0XHRcdHJlZj1cInNoYVwiXG5cdFx0XHRcdFx0XHRpZD17dGhpcy5wcm9wcy50YWIuZmllbGRfaWR9XG5cdFx0XHRcdFx0XHRuYW1lPVwic2hhXCJcblx0XHRcdFx0XHRcdGNsYXNzTmFtZT1cImRyb3Bkb3duXCJcblx0XHRcdFx0XHRcdG9uQ2hhbmdlPXt0aGlzLnByb3BzLmNoYW5nZUhhbmRsZXJ9XG5cdFx0XHRcdFx0XHRzdHlsZT17c3R5bGV9PlxuXHRcdFx0XHRcdFx0PG9wdGlvbiB2YWx1ZT1cIlwiPlNlbGVjdCB7dGhpcy5wcm9wcy50YWIuZmllbGRfaWR9PC9vcHRpb24+XG5cdFx0XHRcdFx0PC9zZWxlY3Q+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBTZWxlY3RvclRleHQgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmaWVsZFwiPlxuXHRcdFx0XHQ8aW5wdXRcblx0XHRcdFx0XHR0eXBlPVwidGV4dFwiXG5cdFx0XHRcdFx0cmVmPVwic2hhXCJcblx0XHRcdFx0XHRpZD17dGhpcy5wcm9wcy50YWIuZmllbGRfaWR9XG5cdFx0XHRcdFx0bmFtZT1cInNoYVwiXG5cdFx0XHRcdFx0Y2xhc3NOYW1lPVwidGV4dFwiXG5cdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMucHJvcHMuY2hhbmdlSGFuZGxlcn1cblx0XHRcdFx0Lz5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgVmVyaWZ5QnV0dG9uID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cIlwiPlxuXHRcdFx0XHQ8YnV0dG9uXG5cdFx0XHRcdFx0ZGlzYWJsZWQ9e3RoaXMucHJvcHMuZGlzYWJsZWR9XG5cdFx0XHRcdFx0dmFsdWU9XCJWZXJpZnkgZGVwbG95bWVudFwiXG5cdFx0XHRcdFx0Y2xhc3NOYW1lPVwiYnRuIGJ0bi1kZWZhdWx0XCJcblx0XHRcdFx0XHRvbkNsaWNrPXt0aGlzLnByb3BzLmNoYW5nZUhhbmRsZXJ9PlxuXHRcdFx0XHRcdFZlcmlmeSBkZXBsb3ltZW50XG5cdFx0XHRcdDwvYnV0dG9uPlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBBZHZhbmNlZE9wdGlvbnMgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImRlcGxveS1vcHRpb25zXCI+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZmllbGRjaGVja2JveFwiPlxuXHRcdFx0XHRcdDxsYWJlbD5cblx0XHRcdFx0XHRcdDxpbnB1dFxuXHRcdFx0XHRcdFx0XHR0eXBlPVwiY2hlY2tib3hcIlxuXHRcdFx0XHRcdFx0XHRuYW1lPVwiZm9yY2VfZnVsbFwiXG5cdFx0XHRcdFx0XHRcdG9uQ2hhbmdlPXt0aGlzLnByb3BzLmNoYW5nZUhhbmRsZXJ9XG5cdFx0XHRcdFx0XHQvPlxuXHRcdFx0XHRcdFx0Rm9yY2UgZnVsbCBkZXBsb3ltZW50XG5cdFx0XHRcdFx0PC9sYWJlbD5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEZXBsb3ltZW50RGlhbG9nO1xuIiwiLyoqXG4gKiBBIHNpbXBsZSBwdWIgc3ViIGV2ZW50IGhhbmRsZXIgZm9yIGludGVyY29tcG9uZW50IGNvbW11bmljYXRpb25cbiAqL1xudmFyIHRvcGljcyA9IHt9O1xudmFyIGhPUCA9IHRvcGljcy5oYXNPd25Qcm9wZXJ0eTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHN1YnNjcmliZTogZnVuY3Rpb24odG9waWMsIGxpc3RlbmVyKSB7XG5cdFx0Ly8gQ3JlYXRlIHRoZSB0b3BpYydzIG9iamVjdCBpZiBub3QgeWV0IGNyZWF0ZWRcblx0XHRpZighaE9QLmNhbGwodG9waWNzLCB0b3BpYykpIHRvcGljc1t0b3BpY10gPSBbXTtcblxuXHRcdC8vIEFkZCB0aGUgbGlzdGVuZXIgdG8gcXVldWVcblx0XHR2YXIgaW5kZXggPSB0b3BpY3NbdG9waWNdLnB1c2gobGlzdGVuZXIpIC0xO1xuXG5cdFx0Ly8gUHJvdmlkZSBoYW5kbGUgYmFjayBmb3IgcmVtb3ZhbCBvZiB0b3BpY1xuXHRcdHJldHVybiB7XG5cdFx0XHRyZW1vdmU6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRkZWxldGUgdG9waWNzW3RvcGljXVtpbmRleF07XG5cdFx0XHR9XG5cdFx0fTtcblx0fSxcblxuXHRwdWJsaXNoOiBmdW5jdGlvbih0b3BpYywgaW5mbykge1xuXHRcdC8vIElmIHRoZSB0b3BpYyBkb2Vzbid0IGV4aXN0LCBvciB0aGVyZSdzIG5vIGxpc3RlbmVycyBpbiBxdWV1ZSwganVzdCBsZWF2ZVxuXHRcdGlmKCFoT1AuY2FsbCh0b3BpY3MsIHRvcGljKSkgcmV0dXJuO1xuXG5cdFx0Ly8gQ3ljbGUgdGhyb3VnaCB0b3BpY3MgcXVldWUsIGZpcmUhXG5cdFx0dG9waWNzW3RvcGljXS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0pIHtcblx0XHRcdGl0ZW0oaW5mbyAhPSB1bmRlZmluZWQgPyBpbmZvIDoge30pO1xuXHRcdH0pO1xuXHR9XG59O1xuIiwiLyoqXG4gKiBIZWxwZXIgY2xhc3MgdG8gY29uY2F0aW5hdGUgc3RyaW5ncyBkZXBlZGluZyBvbiBhIHRydWUgb3IgZmFsc2UuXG4gKlxuICogRXhhbXBsZTpcbiAqIHZhciBjbGFzc2VzID0gSGVscGVycy5jbGFzc05hbWVzKHtcbiAqICAgICBcImRlcGxveS1kcm9wZG93blwiOiB0cnVlLFxuICogICAgIFwibG9hZGluZ1wiOiBmYWxzZSxcbiAqICAgICBcIm9wZW5cIjogdHJ1ZSxcbiAqIH0pO1xuICpcbiAqIHRoZW4gY2xhc3NlcyB3aWxsIGVxdWFsIFwiZGVwbG95LWRyb3Bkb3duIG9wZW5cIlxuICpcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRjbGFzc05hbWVzOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGNsYXNzZXMgPSAnJztcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGFyZyA9IGFyZ3VtZW50c1tpXTtcblx0XHRcdGlmICghYXJnKSBjb250aW51ZTtcblxuXHRcdFx0dmFyIGFyZ1R5cGUgPSB0eXBlb2YgYXJnO1xuXG5cdFx0XHRpZiAoJ3N0cmluZycgPT09IGFyZ1R5cGUgfHwgJ251bWJlcicgPT09IGFyZ1R5cGUpIHtcblx0XHRcdFx0Y2xhc3NlcyArPSAnICcgKyBhcmc7XG5cblx0XHRcdH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSB7XG5cdFx0XHRcdGNsYXNzZXMgKz0gJyAnICsgY2xhc3NOYW1lcy5hcHBseShudWxsLCBhcmcpO1xuXG5cdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09PSBhcmdUeXBlKSB7XG5cdFx0XHRcdGZvciAodmFyIGtleSBpbiBhcmcpIHtcblx0XHRcdFx0XHRpZiAoYXJnLmhhc093blByb3BlcnR5KGtleSkgJiYgYXJnW2tleV0pIHtcblx0XHRcdFx0XHRcdGNsYXNzZXMgKz0gJyAnICsga2V5O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gY2xhc3Nlcy5zdWJzdHIoMSk7XG5cdH1cbn1cbiIsIlxuLyoqXG4gKiBAanN4IFJlYWN0LkRPTVxuICovXG52YXIgU3VtbWFyeVRhYmxlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRpc0VtcHR5OiBmdW5jdGlvbihvYmopIHtcblx0XHRmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG5cdFx0XHRpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkgJiYgb2JqW2tleV0pIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY2hhbmdlcyA9IHRoaXMucHJvcHMuY2hhbmdlcztcblx0XHRpZih0aGlzLmlzRW1wdHkoY2hhbmdlcykpIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblx0XHR2YXIgaWR4ID0gMDtcblx0XHR2YXIgc3VtbWFyeUxpbmVzID0gT2JqZWN0LmtleXMoY2hhbmdlcykubWFwKGZ1bmN0aW9uKGtleSkge1xuXHRcdFx0aWR4Kys7XG5cblx0XHRcdHZhciBjb21wYXJlVXJsID0gbnVsbDtcblx0XHRcdGlmKHR5cGVvZiBjaGFuZ2VzW2tleV0uY29tcGFyZVVybCAhPSAndW5kZWZpbmVkJykge1xuXHRcdFx0XHRjb21wYXJlVXJsID0gY2hhbmdlc1trZXldLmNvbXBhcmVVcmw7XG5cdFx0XHR9XG5cblx0XHRcdGlmKHR5cGVvZiBjaGFuZ2VzW2tleV0uZGVzY3JpcHRpb24hPT0ndW5kZWZpbmVkJykge1xuXG5cdFx0XHRcdGlmIChjaGFuZ2VzW2tleV0uZGVzY3JpcHRpb24hPT1cIlwiKSB7XG5cdFx0XHRcdFx0cmV0dXJuIDxEZXNjcmlwdGlvbk9ubHlTdW1tYXJ5TGluZSBrZXk9e2lkeH0gbmFtZT17a2V5fSBkZXNjcmlwdGlvbj17Y2hhbmdlc1trZXldLmRlc2NyaXB0aW9ufSAvPlxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiA8VW5jaGFuZ2VkU3VtbWFyeUxpbmUga2V5PXtpZHh9IG5hbWU9e2tleX0gdmFsdWU9XCJcIiAvPlxuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSBpZihjaGFuZ2VzW2tleV0uZnJvbSAhPSBjaGFuZ2VzW2tleV0udG8pIHtcblx0XHRcdFx0cmV0dXJuIDxTdW1tYXJ5TGluZSBrZXk9e2lkeH0gbmFtZT17a2V5fSBmcm9tPXtjaGFuZ2VzW2tleV0uZnJvbX0gdG89e2NoYW5nZXNba2V5XS50b30gY29tcGFyZVVybD17Y29tcGFyZVVybH0gLz5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiA8VW5jaGFuZ2VkU3VtbWFyeUxpbmUga2V5PXtpZHh9IG5hbWU9e2tleX0gdmFsdWU9e2NoYW5nZXNba2V5XS5mcm9tfSAvPlxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdDx0YWJsZSBjbGFzc05hbWU9XCJ0YWJsZSB0YWJsZS1zdHJpcGVkIHRhYmxlLWhvdmVyXCI+XG5cdFx0XHRcdDx0Ym9keT5cblx0XHRcdFx0XHR7c3VtbWFyeUxpbmVzfVxuXHRcdFx0XHQ8L3Rib2R5PlxuXHRcdFx0PC90YWJsZT5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIFN1bW1hcnlMaW5lID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBmcm9tID0gdGhpcy5wcm9wcy5mcm9tLFxuXHRcdFx0dG8gPSB0aGlzLnByb3BzLnRvO1xuXG5cdFx0Ly8gbmFpdmUgZ2l0IHNoYSBkZXRlY3Rpb25cblx0XHRpZihmcm9tICE9PSBudWxsICYmIGZyb20ubGVuZ3RoID09PSA0MCkge1xuXHRcdFx0ZnJvbSA9IGZyb20uc3Vic3RyaW5nKDAsNyk7XG5cdFx0fVxuXG5cdFx0Ly8gbmFpdmUgZ2l0IHNoYSBkZXRlY3Rpb25cblx0XHRpZih0byAhPT0gbnVsbCAmJiB0by5sZW5ndGggPT09IDQwKSB7XG5cdFx0XHR0byA9IHRvLnN1YnN0cmluZygwLDcpO1xuXHRcdH1cblxuXHRcdHZhciBjb21wYXJlVXJsID0gbnVsbDtcblx0XHRpZih0aGlzLnByb3BzLmNvbXBhcmVVcmwgIT09IG51bGwpIHtcblx0XHRcdGNvbXBhcmVVcmwgPSA8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPXt0aGlzLnByb3BzLmNvbXBhcmVVcmx9PlZpZXcgZGlmZjwvYT5cblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PHRyPlxuXHRcdFx0XHQ8dGggc2NvcGU9XCJyb3dcIj57dGhpcy5wcm9wcy5uYW1lfTwvdGg+XG5cdFx0XHRcdDx0ZD57ZnJvbX08L3RkPlxuXHRcdFx0XHQ8dGQ+PHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1hcnJvdy1yaWdodFwiIC8+PC90ZD5cblx0XHRcdFx0PHRkPnt0b308L3RkPlxuXHRcdFx0XHQ8dGQgY2xhc3NOYW1lPVwiY2hhbmdlQWN0aW9uXCI+e2NvbXBhcmVVcmx9PC90ZD5cblx0XHRcdDwvdHI+XG5cdFx0KVxuXHR9XG59KTtcblxudmFyIFVuY2hhbmdlZFN1bW1hcnlMaW5lID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBmcm9tID0gdGhpcy5wcm9wcy52YWx1ZTtcblx0XHQvLyBuYWl2ZSBnaXQgc2hhIGRldGVjdGlvblxuXHRcdGlmKGZyb20gIT09IG51bGwgJiYgZnJvbS5sZW5ndGggPT09IDQwKSB7XG5cdFx0XHRmcm9tID0gZnJvbS5zdWJzdHJpbmcoMCw3KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PHRyPlxuXHRcdFx0XHQ8dGggc2NvcGU9XCJyb3dcIj57dGhpcy5wcm9wcy5uYW1lfTwvdGg+XG5cdFx0XHRcdDx0ZD57ZnJvbX08L3RkPlxuXHRcdFx0XHQ8dGQ+Jm5ic3A7PC90ZD5cblx0XHRcdFx0PHRkPjxzcGFuIGNsYXNzTmFtZT1cImxhYmVsIGxhYmVsLXN1Y2Nlc3NcIj5VbmNoYW5nZWQ8L3NwYW4+PC90ZD5cblx0XHRcdFx0PHRkPiZuYnNwOzwvdGQ+XG5cdFx0XHQ8L3RyPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgRGVzY3JpcHRpb25Pbmx5U3VtbWFyeUxpbmUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDx0cj5cblx0XHRcdFx0PHRoIHNjb3BlPVwicm93XCI+e3RoaXMucHJvcHMubmFtZX08L3RoPlxuXHRcdFx0XHQ8dGQgY29sU3Bhbj1cIjRcIiBkYW5nZXJvdXNseVNldElubmVySFRNTD17e19faHRtbDogdGhpcy5wcm9wcy5kZXNjcmlwdGlvbn19IC8+XG5cdFx0XHQ8L3RyPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN1bW1hcnlUYWJsZTtcbiJdfQ==
