(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var DeploymentDialog = require('./deployment_dialog.jsx');

// Mount the component only on the page where the holder is actually present.
if (typeof document.getElementById('deployment-dialog-holder')!=='undefined') {
	React.render(
		React.createElement(DeploymentDialog, {context: environmentConfigContext}),
		document.getElementById('deployment-dialog-holder')
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
				React.createElement("thead", null, 
					React.createElement("tr", null, 
						React.createElement("th", null, " "), 
						React.createElement("th", null, " "), 
						React.createElement("th", {className: "transitionIcon"}, " "), 
						React.createElement("th", null, " "), 
						React.createElement("th", {className: "changeAction"}, " ")
					)
				), 
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvbXV6ZG93c2tpL1NpdGVzL2RlcGxveS1zaWx2ZXJzdHJpcGUtY29tL2RlcGxveW5hdXQvanMvYmFzZS5qc3giLCIvVXNlcnMvbXV6ZG93c2tpL1NpdGVzL2RlcGxveS1zaWx2ZXJzdHJpcGUtY29tL2RlcGxveW5hdXQvanMvZGVwbG95X3BsYW4uanN4IiwiL1VzZXJzL211emRvd3NraS9TaXRlcy9kZXBsb3ktc2lsdmVyc3RyaXBlLWNvbS9kZXBsb3luYXV0L2pzL2RlcGxveW1lbnRfZGlhbG9nLmpzeCIsIi9Vc2Vycy9tdXpkb3dza2kvU2l0ZXMvZGVwbG95LXNpbHZlcnN0cmlwZS1jb20vZGVwbG95bmF1dC9qcy9ldmVudHMuanMiLCIvVXNlcnMvbXV6ZG93c2tpL1NpdGVzL2RlcGxveS1zaWx2ZXJzdHJpcGUtY29tL2RlcGxveW5hdXQvanMvaGVscGVycy5qcyIsIi9Vc2Vycy9tdXpkb3dza2kvU2l0ZXMvZGVwbG95LXNpbHZlcnN0cmlwZS1jb20vZGVwbG95bmF1dC9qcy9zdW1tYXJ5X3RhYmxlLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLElBQUksZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLHlCQUF5QixDQUFDLENBQUM7O0FBRTFELDZFQUE2RTtBQUM3RSxJQUFJLE9BQU8sUUFBUSxDQUFDLGNBQWMsQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLFdBQVcsRUFBRTtDQUM3RSxLQUFLLENBQUMsTUFBTTtFQUNYLG9CQUFDLGdCQUFnQixFQUFBLENBQUEsQ0FBQyxPQUFBLEVBQU8sR0FBSSx3QkFBeUIsQ0FBQSxDQUFHLENBQUE7RUFDekQsUUFBUSxDQUFDLGNBQWMsQ0FBQywwQkFBMEIsQ0FBQztFQUNuRCxDQUFDO0NBQ0Y7OztBQ1JELElBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztB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Y2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgRGVwbG95bWVudERpYWxvZyA9IHJlcXVpcmUoJy4vZGVwbG95bWVudF9kaWFsb2cuanN4Jyk7XG5cbi8vIE1vdW50IHRoZSBjb21wb25lbnQgb25seSBvbiB0aGUgcGFnZSB3aGVyZSB0aGUgaG9sZGVyIGlzIGFjdHVhbGx5IHByZXNlbnQuXG5pZiAodHlwZW9mIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZXBsb3ltZW50LWRpYWxvZy1ob2xkZXInKSE9PSd1bmRlZmluZWQnKSB7XG5cdFJlYWN0LnJlbmRlcihcblx0XHQ8RGVwbG95bWVudERpYWxvZyBjb250ZXh0ID0ge2Vudmlyb25tZW50Q29uZmlnQ29udGV4dH0gLz4sXG5cdFx0ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlcGxveW1lbnQtZGlhbG9nLWhvbGRlcicpXG5cdCk7XG59XG4iLCJ2YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcbnZhciBIZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzLmpzJyk7XG52YXIgU3VtbWFyeVRhYmxlID0gcmVxdWlyZSgnLi9zdW1tYXJ5X3RhYmxlLmpzeCcpO1xuXG52YXIgRGVwbG95UGxhbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0bG9hZGluZ1N1YjogbnVsbCxcblx0bG9hZGluZ0RvbmVTdWI6IG51bGwsXG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGxvYWRpbmdfY2hhbmdlczogZmFsc2UsXG5cdFx0XHRkZXBsb3lfZGlzYWJsZWQ6IGZhbHNlLFxuXHRcdFx0ZGVwbG95SG92ZXI6IGZhbHNlXG5cdFx0fVxuXHR9LFxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdC8vIHJlZ2lzdGVyIHN1YnNjcmliZXJzXG5cdFx0dGhpcy5sb2FkaW5nU3ViID0gRXZlbnRzLnN1YnNjcmliZSgnY2hhbmdlX2xvYWRpbmcnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0bG9hZGluZ19jaGFuZ2VzOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0XHR0aGlzLmxvYWRpbmdEb25lU3ViID0gRXZlbnRzLnN1YnNjcmliZSgnY2hhbmdlX2xvYWRpbmcvZG9uZScsIGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0XHRsb2FkaW5nX2NoYW5nZXM6IGZhbHNlXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0fSxcblx0ZGVwbG95SGFuZGxlcjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0ZGVwbG95X2Rpc2FibGVkOiB0cnVlXG5cdFx0fSk7XG5cblx0XHRRKCQuYWpheCh7XG5cdFx0XHR0eXBlOiBcIlBPU1RcIixcblx0XHRcdGRhdGFUeXBlOiAnanNvbicsXG5cdFx0XHR1cmw6IHRoaXMucHJvcHMuY29udGV4dC5lbnZVcmwgKyAnL3N0YXJ0LWRlcGxveScsXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdC8vIFBhc3MgdGhlIHN0cmF0ZWd5IG9iamVjdCB0aGUgdXNlciBoYXMganVzdCBzaWduZWQgb2ZmIGJhY2sgdG8gdGhlIGJhY2tlbmQuXG5cdFx0XHRcdCdzdHJhdGVneSc6IHRoaXMucHJvcHMuc3VtbWFyeSxcblx0XHRcdFx0J1NlY3VyaXR5SUQnOiB0aGlzLnByb3BzLnN1bW1hcnkuU2VjdXJpdHlJRFxuXHRcdFx0fVxuXHRcdH0pKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdHdpbmRvdy5sb2NhdGlvbiA9IGRhdGEudXJsO1xuXHRcdH0sIGZ1bmN0aW9uKGRhdGEpe1xuXHRcdFx0Y29uc29sZS5lcnJvcihkYXRhKTtcblx0XHR9KTtcblx0fSxcblx0bW91c2VFbnRlckhhbmRsZXI6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7ZGVwbG95SG92ZXI6IHRydWV9KTtcblx0fSxcblx0bW91c2VMZWF2ZUhhbmRsZXI6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7ZGVwbG95SG92ZXI6IGZhbHNlfSk7XG5cdH0sXG5cdGNhbkRlcGxveTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICh0aGlzLnByb3BzLnN1bW1hcnkudmFsaWRhdGlvbkNvZGU9PT1cInN1Y2Nlc3NcIiB8fCB0aGlzLnByb3BzLnN1bW1hcnkudmFsaWRhdGlvbkNvZGU9PT1cIndhcm5pbmdcIik7XG5cdH0sXG5cdGlzRW1wdHk6IGZ1bmN0aW9uKG9iaikge1xuXHRcdGZvciAodmFyIGtleSBpbiBvYmopIHtcblx0XHRcdGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSAmJiBvYmpba2V5XSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiB0cnVlO1xuXHR9LFxuXHRzaG93Tm9DaGFuZ2VzTWVzc2FnZTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHN1bW1hcnkgPSB0aGlzLnByb3BzLnN1bW1hcnk7XG5cdFx0aWYoc3VtbWFyeS5pbml0aWFsU3RhdGUgPT09IHRydWUpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdFx0aWYoc3VtbWFyeS5tZXNzYWdlcyA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblx0XHRyZXR1cm4gKHRoaXMuaXNFbXB0eShzdW1tYXJ5LmNoYW5nZXMpICYmIHN1bW1hcnkubWVzc2FnZXMubGVuZ3RoID09PSAwKTtcblx0fSxcblx0YWN0aW9uVGl0bGU6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBhY3Rpb25UaXRsZSA9IHRoaXMucHJvcHMuc3VtbWFyeS5hY3Rpb25UaXRsZTtcblx0XHRpZiAodHlwZW9mIGFjdGlvblRpdGxlID09PSAndW5kZWZpbmVkJyB8fCBhY3Rpb25UaXRsZSA9PT0gJycgKSB7XG5cdFx0XHRyZXR1cm4gJ01ha2UgYSBzZWxlY3Rpb24nO1xuXHRcdH1cblx0XHRyZXR1cm4gdGhpcy5wcm9wcy5zdW1tYXJ5LmFjdGlvblRpdGxlO1xuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBtZXNzYWdlcyA9IHRoaXMucHJvcHMuc3VtbWFyeS5tZXNzYWdlcztcblx0XHRpZiAodGhpcy5zaG93Tm9DaGFuZ2VzTWVzc2FnZSgpKSB7XG5cdFx0XHRtZXNzYWdlcyA9IFt7XG5cdFx0XHRcdHRleHQ6IFwiVGhlcmUgYXJlIG5vIGNoYW5nZXMgYnV0IHlvdSBjYW4gZGVwbG95IGFueXdheSBpZiB5b3Ugd2lzaC5cIixcblx0XHRcdFx0Y29kZTogXCJzdWNjZXNzXCJcblx0XHRcdH1dO1xuXHRcdH1cblxuXHRcdHZhciBkZXBsb3lBY3Rpb247XG5cdFx0aWYodGhpcy5jYW5EZXBsb3koKSkge1xuXHRcdFx0ZGVwbG95QWN0aW9uID0gKFxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlY3Rpb25cIlxuXHRcdFx0XHRcdG9uTW91c2VFbnRlcj17dGhpcy5tb3VzZUVudGVySGFuZGxlcn1cblx0XHRcdFx0XHRvbk1vdXNlTGVhdmU9e3RoaXMubW91c2VMZWF2ZUhhbmRsZXJ9PlxuXHRcdFx0XHRcdFx0PGJ1dHRvblxuXHRcdFx0XHRcdFx0XHR2YWx1ZT1cIkNvbmZpcm0gRGVwbG95bWVudFwiXG5cdFx0XHRcdFx0XHRcdGNsYXNzTmFtZT1cImRlcGxveSBwdWxsLWxlZnRcIlxuXHRcdFx0XHRcdFx0XHRkaXNhYmxlZD17dGhpcy5zdGF0ZS5kZXBsb3lfZGlzYWJsZWR9XG5cdFx0XHRcdFx0XHRcdG9uQ2xpY2s9e3RoaXMuZGVwbG95SGFuZGxlcn0+XG5cdFx0XHRcdFx0XHRcdHt0aGlzLmFjdGlvblRpdGxlKCl9XG5cdFx0XHRcdFx0XHQ8L2J1dHRvbj5cblx0XHRcdFx0XHRcdDxRdWlja1N1bW1hcnkgYWN0aXZhdGVkPXt0aGlzLnN0YXRlLmRlcGxveUhvdmVyfSBjb250ZXh0PXt0aGlzLnByb3BzLmNvbnRleHR9IHN1bW1hcnk9e3RoaXMucHJvcHMuc3VtbWFyeX0gLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHZhciBoZWFkZXJDbGFzc2VzID0gSGVscGVycy5jbGFzc05hbWVzKHtcblx0XHRcdGhlYWRlcjogdHJ1ZSxcblx0XHRcdGluYWN0aXZlOiAhdGhpcy5jYW5EZXBsb3koKSxcblx0XHRcdGxvYWRpbmc6IHRoaXMuc3RhdGUubG9hZGluZ19jaGFuZ2VzXG5cdFx0fSk7XG5cblx0XHRyZXR1cm4oXG5cdFx0XHQ8ZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlY3Rpb25cIj5cblx0XHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT17aGVhZGVyQ2xhc3Nlc30+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJzdGF0dXMtaWNvblwiPjwvc3Bhbj5cblx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cIm51bWJlckNpcmNsZVwiPjI8L3NwYW4+IFJldmlldyBjaGFuZ2VzXG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0PE1lc3NhZ2VMaXN0IG1lc3NhZ2VzPXttZXNzYWdlc30gLz5cblx0XHRcdFx0XHQ8U3VtbWFyeVRhYmxlIGNoYW5nZXM9e3RoaXMucHJvcHMuc3VtbWFyeS5jaGFuZ2VzfSAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0e2RlcGxveUFjdGlvbn1cblx0XHRcdDwvZGl2PlxuXHRcdClcblx0fVxufSk7XG5cbnZhciBRdWlja1N1bW1hcnkgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHR5cGUgPSAodGhpcy5wcm9wcy5zdW1tYXJ5LmFjdGlvbkNvZGU9PT0nZmFzdCcgPyAnY29kZS1vbmx5JyA6ICdmdWxsJyk7XG5cdFx0dmFyIGVzdGltYXRlID0gW107XG5cdFx0aWYgKHRoaXMucHJvcHMuc3VtbWFyeS5lc3RpbWF0ZWRUaW1lICYmIHRoaXMucHJvcHMuc3VtbWFyeS5lc3RpbWF0ZWRUaW1lPjApIHtcblx0XHRcdGVzdGltYXRlID0gW1xuXHRcdFx0XHQ8ZHQ+RHVyYXRpb246PC9kdD4sXG5cdFx0XHRcdDxkZD57dGhpcy5wcm9wcy5zdW1tYXJ5LmVzdGltYXRlZFRpbWV9IG1pbiBhcHByb3guPC9kZD5cblx0XHRcdF07XG5cdFx0fVxuXG5cdFx0dmFyIGRsQ2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG5cdFx0XHRhY3RpdmF0ZWQ6IHRoaXMucHJvcHMuYWN0aXZhdGVkLFxuXHRcdFx0J3F1aWNrLXN1bW1hcnknOiB0cnVlXG5cdFx0fSk7XG5cblx0XHR2YXIgbW9yZUluZm8gPSBudWxsO1xuXHRcdGlmICh0eXBlb2YgdGhpcy5wcm9wcy5jb250ZXh0LmRlcGxveUhlbHAhPT0ndW5kZWZpbmVkJyAmJiB0aGlzLnByb3BzLmNvbnRleHQuZGVwbG95SGVscCkge1xuXHRcdFx0bW9yZUluZm8gPSAoXG5cdFx0XHRcdDxhIHRhcmdldD1cIl9ibGFua1wiIGNsYXNzTmFtZT1cInNtYWxsXCIgaHJlZj17dGhpcy5wcm9wcy5jb250ZXh0LmRlcGxveUhlbHB9Pm1vcmUgaW5mbzwvYT5cblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMucHJvcHMuY29udGV4dC5zaXRlVXJsKSB7XG5cdFx0XHR2YXIgZW52ID0gPGEgdGFyZ2V0PVwiX2JsYW5rXCIgaHJlZj17dGhpcy5wcm9wcy5jb250ZXh0LnNpdGVVcmx9Pnt0aGlzLnByb3BzLmNvbnRleHQuZW52TmFtZX08L2E+O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YXIgZW52ID0gPHNwYW4+e3RoaXMucHJvcHMuY29udGV4dC5lbnZOYW1lfTwvc3Bhbj47XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkbCBjbGFzc05hbWU9e2RsQ2xhc3Nlc30+XG5cdFx0XHRcdDxkdD5FbnZpcm9ubWVudDo8L2R0PlxuXHRcdFx0XHQ8ZGQ+e2Vudn08L2RkPlxuXHRcdFx0XHQ8ZHQ+RGVwbG95IHR5cGU6PC9kdD5cblx0XHRcdFx0PGRkPnt0eXBlfSB7bW9yZUluZm99PC9kZD5cblx0XHRcdFx0e2VzdGltYXRlfVxuXHRcdFx0PC9kbD5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIE1lc3NhZ2VMaXN0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGlmKHRoaXMucHJvcHMubWVzc2FnZXMubGVuZ3RoIDwgMSkge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHRcdGlmKHR5cGVvZiB0aGlzLnByb3BzLm1lc3NhZ2VzID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHRcdHZhciBpZHggPSAwO1xuXHRcdHZhciBtZXNzYWdlcyA9IHRoaXMucHJvcHMubWVzc2FnZXMubWFwKGZ1bmN0aW9uKG1lc3NhZ2UpIHtcblx0XHRcdGlkeCsrO1xuXHRcdFx0cmV0dXJuIDxNZXNzYWdlIGtleT17aWR4fSBtZXNzYWdlPXttZXNzYWdlfSAvPlxuXHRcdH0pO1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2PlxuXHRcdFx0XHR7bWVzc2FnZXN9XG5cdFx0XHQ8L2Rpdj5cblx0XHQpXG5cdH1cbn0pO1xuXG52YXIgTWVzc2FnZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY2xhc3NNYXAgPSB7XG5cdFx0XHQnZXJyb3InOiAnYWxlcnQgYWxlcnQtZGFuZ2VyJyxcblx0XHRcdCd3YXJuaW5nJzogJ2FsZXJ0IGFsZXJ0LXdhcm5pbmcnLFxuXHRcdFx0J3N1Y2Nlc3MnOiAnYWxlcnQgYWxlcnQtaW5mbydcblx0XHR9O1xuXHRcdHZhciBjbGFzc25hbWU9Y2xhc3NNYXBbdGhpcy5wcm9wcy5tZXNzYWdlLmNvZGVdO1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT17Y2xhc3NuYW1lfSByb2xlPVwiYWxlcnRcIlxuXHRcdFx0XHRkYW5nZXJvdXNseVNldElubmVySFRNTD17e19faHRtbDogdGhpcy5wcm9wcy5tZXNzYWdlLnRleHR9fSAvPlxuXHRcdClcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRGVwbG95UGxhbjtcbiIsInZhciBFdmVudHMgPSByZXF1aXJlKCcuL2V2ZW50cy5qcycpO1xudmFyIEhlbHBlcnMgPSByZXF1aXJlKCcuL2hlbHBlcnMuanMnKTtcbnZhciBEZXBsb3lQbGFuID0gcmVxdWlyZSgnLi9kZXBsb3lfcGxhbi5qc3gnKTtcblxudmFyIERlcGxveW1lbnREaWFsb2cgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cblx0bG9hZGluZ1N1YjogbnVsbCxcblxuXHRsb2FkaW5nRG9uZVN1YjogbnVsbCxcblxuXHRlcnJvclN1YjogbnVsbCxcblxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRsb2FkaW5nOiBmYWxzZSxcblx0XHRcdGxvYWRpbmdUZXh0OiBcIlwiLFxuXHRcdFx0ZXJyb3JUZXh0OiBcIlwiLFxuXHRcdFx0ZmV0Y2hlZDogdHJ1ZSxcblx0XHRcdGxhc3RfZmV0Y2hlZDogXCJcIlxuXHRcdH07XG5cdH0sXG5cdGNvbXBvbmVudERpZE1vdW50OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0Ly8gYWRkIHN1YnNjcmliZXJzXG5cdFx0dGhpcy5sb2FkaW5nU3ViID0gRXZlbnRzLnN1YnNjcmliZSgnbG9hZGluZycsIGZ1bmN0aW9uKHRleHQpIHtcblx0XHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0XHRsb2FkaW5nOiB0cnVlLFxuXHRcdFx0XHRzdWNjZXNzOiBmYWxzZSxcblx0XHRcdFx0bG9hZGluZ1RleHQ6IHRleHRcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHRcdHRoaXMubG9hZGluZ0RvbmVTdWIgPSBFdmVudHMuc3Vic2NyaWJlKCdsb2FkaW5nL2RvbmUnLCBmdW5jdGlvbigpIHtcblx0XHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0XHRsb2FkaW5nOiBmYWxzZSxcblx0XHRcdFx0bG9hZGluZ1RleHQ6ICcnLFxuXHRcdFx0XHRzdWNjZXNzOiB0cnVlXG5cdFx0XHR9KTtcblx0XHR9KTtcblx0XHR0aGlzLmVycm9yU3ViID0gRXZlbnRzLnN1YnNjcmliZSgnZXJyb3InLCBmdW5jdGlvbih0ZXh0KSB7XG5cdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0ZXJyb3JUZXh0OiB0ZXh0LFxuXHRcdFx0XHRsb2FkaW5nOiBmYWxzZSxcblx0XHRcdFx0bG9hZGluZ1RleHQ6ICcnLFxuXHRcdFx0XHRzdWNjZXNzOiBmYWxzZVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0sXG5cdGNvbXBvbmVudFdpbGxVbm1vdW50OiBmdW5jdGlvbigpIHtcblx0XHQvLyByZW1vdmUgc3Vic2NyaWJlcnNcblx0XHR0aGlzLmxvYWRpbmdTdWIucmVtb3ZlKCk7XG5cdFx0dGhpcy5sb2FkaW5nRG9uZVN1Yi5yZW1vdmUoKTtcblx0XHR0aGlzLmVycm9yU3ViLnJlbW92ZSgpO1xuXHR9LFxuXHRoYW5kbGVDbGljazogZnVuY3Rpb24oZSkge1xuXHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRFdmVudHMucHVibGlzaCgnbG9hZGluZycsIFwiRmV0Y2hpbmcgbGF0ZXN0IGNvZGXigKZcIik7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRmZXRjaGVkOiBmYWxzZVxuXHRcdH0pO1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRRKCQuYWpheCh7XG5cdFx0XHR0eXBlOiBcIlBPU1RcIixcblx0XHRcdGRhdGFUeXBlOiAnanNvbicsXG5cdFx0XHR1cmw6IHRoaXMucHJvcHMuY29udGV4dC5wcm9qZWN0VXJsICsgJy9mZXRjaCdcblx0XHR9KSlcblx0XHRcdC50aGVuKHRoaXMud2FpdEZvckZldGNoVG9Db21wbGV0ZSwgdGhpcy5mZXRjaFN0YXR1c0Vycm9yKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oKSB7XG5cdFx0XHRcdEV2ZW50cy5wdWJsaXNoKCdsb2FkaW5nL2RvbmUnKTtcblx0XHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdFx0ZmV0Y2hlZDogdHJ1ZVxuXHRcdFx0XHR9KVxuXHRcdFx0fSkuY2F0Y2godGhpcy5mZXRjaFN0YXR1c0Vycm9yKS5kb25lKCk7XG5cdH0sXG5cdHdhaXRGb3JGZXRjaFRvQ29tcGxldGU6ZnVuY3Rpb24gKGZldGNoRGF0YSkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRyZXR1cm4gdGhpcy5nZXRGZXRjaFN0YXR1cyhmZXRjaERhdGEpLnRoZW4oZnVuY3Rpb24gKGRhdGEpIHtcblx0XHRcdGlmIChkYXRhLnN0YXR1cyA9PT0gXCJDb21wbGV0ZVwiKSB7XG5cdFx0XHRcdHJldHVybiBkYXRhO1xuXHRcdFx0fVxuXHRcdFx0aWYgKGRhdGEuc3RhdHVzID09PSBcIkZhaWxlZFwiKSB7XG5cdFx0XHRcdHJldHVybiAkLkRlZmVycmVkKGZ1bmN0aW9uIChkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGQucmVqZWN0KGRhdGEpO1xuXHRcdFx0XHR9KS5wcm9taXNlKCk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gc2VsZi53YWl0Rm9yRmV0Y2hUb0NvbXBsZXRlKGZldGNoRGF0YSk7XG5cdFx0fSk7XG5cdH0sXG5cdGdldEZldGNoU3RhdHVzOiBmdW5jdGlvbiAoZmV0Y2hEYXRhKSB7XG5cdFx0cmV0dXJuIFEoJC5hamF4KHtcblx0XHRcdHR5cGU6IFwiR0VUXCIsXG5cdFx0XHR1cmw6IGZldGNoRGF0YS5ocmVmLFxuXHRcdFx0ZGF0YVR5cGU6ICdqc29uJ1xuXHRcdH0pKTtcblx0fSxcblx0ZmV0Y2hTdGF0dXNFcnJvcjogZnVuY3Rpb24oZGF0YSkge1xuXHRcdHZhciBtZXNzYWdlICA9ICdVbmtub3duIGVycm9yJztcblx0XHRpZih0eXBlb2YgZGF0YS5yZXNwb25zZVRleHQgIT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRtZXNzYWdlID0gZGF0YS5yZXNwb25zZVRleHQ7XG5cdFx0fSBlbHNlIGlmICh0eXBlb2YgZGF0YS5tZXNzYWdlICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0bWVzc2FnZSA9IGRhdGEubWVzc2FnZTtcblx0XHR9XG5cdFx0RXZlbnRzLnB1Ymxpc2goJ2Vycm9yJywgbWVzc2FnZSk7XG5cdH0sXG5cdGxhc3RGZXRjaGVkSGFuZGxlcjogZnVuY3Rpb24odGltZV9hZ28pIHtcblx0XHR0aGlzLnNldFN0YXRlKHtsYXN0X2ZldGNoZWQ6IHRpbWVfYWdvfSk7XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNsYXNzZXMgPSBIZWxwZXJzLmNsYXNzTmFtZXMoe1xuXHRcdFx0XCJkZXBsb3ktZHJvcGRvd25cIjogdHJ1ZSxcblx0XHRcdFwibG9hZGluZ1wiOiB0aGlzLnN0YXRlLmxvYWRpbmcsXG5cdFx0XHRcInN1Y2Nlc3NcIjogdGhpcy5zdGF0ZS5zdWNjZXNzXG5cdFx0fSk7XG5cblx0XHR2YXIgZm9ybTtcblxuXHRcdGlmKHRoaXMuc3RhdGUuZXJyb3JUZXh0ICE9PSBcIlwiKSB7XG5cdFx0XHRmb3JtID0gPEVycm9yTWVzc2FnZXMgbWVzc2FnZT17dGhpcy5zdGF0ZS5lcnJvclRleHR9IC8+XG5cdFx0fSBlbHNlIGlmKHRoaXMuc3RhdGUuZmV0Y2hlZCkge1xuXHRcdFx0Zm9ybSA9IDxEZXBsb3lGb3JtIGNvbnRleHQ9e3RoaXMucHJvcHMuY29udGV4dH0gZGF0YT17dGhpcy5wcm9wcy5kYXRhfSBsYXN0RmV0Y2hlZEhhbmRsZXI9e3RoaXMubGFzdEZldGNoZWRIYW5kbGVyfSAvPlxuXHRcdH0gZWxzZSBpZiAodGhpcy5zdGF0ZS5sb2FkaW5nKSB7XG5cdFx0XHRmb3JtID0gPExvYWRpbmdEZXBsb3lGb3JtIG1lc3NhZ2U9XCJGZXRjaGluZyBsYXRlc3QgY29kZSZoZWxsaXA7XCIgLz5cblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9e2NsYXNzZXN9IG9uQ2xpY2s9e3RoaXMuaGFuZGxlQ2xpY2t9PlxuXHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cInN0YXR1cy1pY29uXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9zcGFuPlxuXHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cInRpbWVcIj5sYXN0IHVwZGF0ZWQge3RoaXMuc3RhdGUubGFzdF9mZXRjaGVkfTwvc3Bhbj5cblx0XHRcdFx0XHQ8RW52aXJvbm1lbnROYW1lIGVudmlyb25tZW50TmFtZT17dGhpcy5wcm9wcy5jb250ZXh0LmVudk5hbWV9IC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHR7Zm9ybX1cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgTG9hZGluZ0RlcGxveUZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZGVwbG95LWZvcm0tbG9hZGluZ1wiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImljb24taG9sZGVyXCI+XG5cdFx0XHRcdFx0PGkgY2xhc3NOYW1lPVwiZmEgZmEtY29nIGZhLXNwaW5cIj48L2k+XG5cdFx0XHRcdFx0PHNwYW4+e3RoaXMucHJvcHMubWVzc2FnZX08L3NwYW4+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBFcnJvck1lc3NhZ2VzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImRlcGxveS1kcm9wZG93bi1lcnJvcnNcIj5cblx0XHRcdFx0e3RoaXMucHJvcHMubWVzc2FnZX1cblx0XHRcdDwvZGl2PlxuXHRcdClcblx0fVxufSk7XG5cbi8qKlxuICogRW52aXJvbm1lbnROYW1lXG4gKi9cbnZhciBFbnZpcm9ubWVudE5hbWUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJlbnZpcm9ubWVudC1uYW1lXCI+XG5cdFx0XHRcdDxpIGNsYXNzTmFtZT1cImZhIGZhLXJvY2tldFwiPiZuYnNwOzwvaT5cblx0XHRcdFx0RGVwbG95bWVudCBvcHRpb25zIDxzcGFuIGNsYXNzTmFtZT1cImhpZGRlbi14c1wiPmZvciB7dGhpcy5wcm9wcy5lbnZpcm9ubWVudE5hbWV9PC9zcGFuPlxuXHRcdFx0PC9zcGFuPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG4vKipcbiAqIERlcGxveUZvcm1cbiAqL1xudmFyIERlcGxveUZvcm0gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHNlbGVjdGVkVGFiOiAxLFxuXHRcdFx0ZGF0YTogW11cblx0XHR9O1xuXHR9LFxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5naXREYXRhKCk7XG5cdH0sXG5cblx0Z2l0RGF0YTogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0bG9hZGluZzogdHJ1ZVxuXHRcdH0pO1xuXHRcdFEoJC5hamF4KHtcblx0XHRcdHR5cGU6IFwiUE9TVFwiLFxuXHRcdFx0ZGF0YVR5cGU6ICdqc29uJyxcblx0XHRcdHVybDogdGhpcy5wcm9wcy5jb250ZXh0LmVudlVybCArICcvZ2l0X3JldmlzaW9ucydcblx0XHR9KSkudGhlbihmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0bG9hZGluZzogZmFsc2UsXG5cdFx0XHRcdGRhdGE6IGRhdGEuVGFic1xuXHRcdFx0fSk7XG5cdFx0XHRzZWxmLnByb3BzLmxhc3RGZXRjaGVkSGFuZGxlcihkYXRhLmxhc3RfZmV0Y2hlZCk7XG5cdFx0fSwgZnVuY3Rpb24oZGF0YSl7XG5cdFx0XHRFdmVudHMucHVibGlzaCgnZXJyb3InLCBkYXRhKTtcblx0XHR9KTtcblx0fSxcblxuXHRzZWxlY3RIYW5kbGVyOiBmdW5jdGlvbihpZCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe3NlbGVjdGVkVGFiOiBpZH0pO1xuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRpZih0aGlzLnN0YXRlLmxvYWRpbmcpIHtcblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdDxMb2FkaW5nRGVwbG95Rm9ybSBtZXNzYWdlPVwiTG9hZGluZyZoZWxsaXA7XCIgLz5cblx0XHRcdCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZGVwbG95LWZvcm0tb3V0ZXIgY2xlYXJmaXhcIj5cblx0XHRcdFx0PGZvcm0gY2xhc3NOYW1lPVwiZm9ybS1pbmxpbmUgZGVwbG95LWZvcm1cIiBhY3Rpb249XCJQT1NUXCIgYWN0aW9uPVwiI1wiPlxuXHRcdFx0XHRcdDxEZXBsb3lUYWJTZWxlY3RvciBkYXRhPXt0aGlzLnN0YXRlLmRhdGF9IG9uU2VsZWN0PXt0aGlzLnNlbGVjdEhhbmRsZXJ9IHNlbGVjdGVkVGFiPXt0aGlzLnN0YXRlLnNlbGVjdGVkVGFifSAvPlxuXHRcdFx0XHRcdDxEZXBsb3lUYWJzIGNvbnRleHQ9e3RoaXMucHJvcHMuY29udGV4dH0gZGF0YT17dGhpcy5zdGF0ZS5kYXRhfSBzZWxlY3RlZFRhYj17dGhpcy5zdGF0ZS5zZWxlY3RlZFRhYn0gU2VjdXJpdHlUb2tlbj17dGhpcy5zdGF0ZS5TZWN1cml0eVRva2VufSAvPlxuXHRcdFx0XHQ8L2Zvcm0+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxuLyoqXG4gKiBEZXBsb3lUYWJTZWxlY3RvclxuICovXG52YXIgRGVwbG95VGFiU2VsZWN0b3IgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHR2YXIgc2VsZWN0b3JzID0gdGhpcy5wcm9wcy5kYXRhLm1hcChmdW5jdGlvbih0YWIpIHtcblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdDxEZXBsb3lUYWJTZWxlY3Qga2V5PXt0YWIuaWR9IHRhYj17dGFifSBvblNlbGVjdD17c2VsZi5wcm9wcy5vblNlbGVjdH0gc2VsZWN0ZWRUYWI9e3NlbGYucHJvcHMuc2VsZWN0ZWRUYWJ9IC8+XG5cdFx0XHQpO1xuXHRcdH0pO1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8dWwgY2xhc3NOYW1lPVwiU2VsZWN0aW9uR3JvdXAgdGFiYmVkc2VsZWN0aW9uZ3JvdXAgbm9sYWJlbFwiPlxuXHRcdFx0XHR7c2VsZWN0b3JzfVxuXHRcdFx0PC91bD5cblx0XHQpO1xuXHR9XG59KTtcblxuLyoqXG4gKiBEZXBsb3lUYWJTZWxlY3RcbiAqL1xudmFyIERlcGxveVRhYlNlbGVjdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0aGFuZGxlQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0dGhpcy5wcm9wcy5vblNlbGVjdCh0aGlzLnByb3BzLnRhYi5pZClcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGNsYXNzZXMgPSBIZWxwZXJzLmNsYXNzTmFtZXMoe1xuXHRcdFx0XCJhY3RpdmVcIiA6ICh0aGlzLnByb3BzLnNlbGVjdGVkVGFiID09IHRoaXMucHJvcHMudGFiLmlkKVxuXHRcdH0pO1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8bGkgY2xhc3NOYW1lPXtjbGFzc2VzfT5cblx0XHRcdFx0PGEgb25DbGljaz17dGhpcy5oYW5kbGVDbGlja30gaHJlZj17XCIjZGVwbG95LXRhYi1cIit0aGlzLnByb3BzLnRhYi5pZH0gPnt0aGlzLnByb3BzLnRhYi5uYW1lfTwvYT5cblx0XHRcdDwvbGk+XG5cdFx0KTtcblx0fVxuXG59KTtcblxuLyoqXG4gKiBEZXBsb3lUYWJzXG4gKi9cbnZhciBEZXBsb3lUYWJzID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIHRhYnMgPSB0aGlzLnByb3BzLmRhdGEubWFwKGZ1bmN0aW9uKHRhYikge1xuXHRcdFx0cmV0dXJuIChcblx0XHRcdFx0PERlcGxveVRhYiBjb250ZXh0PXtzZWxmLnByb3BzLmNvbnRleHR9IGtleT17dGFiLmlkfSB0YWI9e3RhYn0gc2VsZWN0ZWRUYWI9e3NlbGYucHJvcHMuc2VsZWN0ZWRUYWJ9IFNlY3VyaXR5VG9rZW49e3NlbGYucHJvcHMuU2VjdXJpdHlUb2tlbn0gLz5cblx0XHRcdCk7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJ0YWItY29udGVudFwiPlxuXHRcdFx0XHR7dGFic31cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG4vKipcbiAqIERlcGxveVRhYlxuICovXG52YXIgRGVwbG95VGFiID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzdW1tYXJ5OiB0aGlzLmdldEluaXRpYWxTdW1tYXJ5U3RhdGUoKSxcblx0XHRcdG9wdGlvbnM6IHt9LFxuXHRcdFx0c2hhOiAnJ1xuXHRcdH07XG5cdH0sXG5cdGdldEluaXRpYWxTdW1tYXJ5U3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRjaGFuZ2VzOiB7fSxcblx0XHRcdG1lc3NhZ2VzOiBbXSxcblx0XHRcdHZhbGlkYXRpb25Db2RlOiAnJyxcblx0XHRcdGVzdGltYXRlZFRpbWU6IG51bGwsXG5cdFx0XHRhY3Rpb25Db2RlOiBudWxsLFxuXHRcdFx0aW5pdGlhbFN0YXRlOiB0cnVlXG5cdFx0fVxuXHR9LFxuXHRPcHRpb25DaGFuZ2VIYW5kbGVyOiBmdW5jdGlvbihldmVudCkge1xuXHRcdHZhciBvcHRpb25zID0gdGhpcy5zdGF0ZS5vcHRpb25zO1xuXHRcdG9wdGlvbnNbZXZlbnQudGFyZ2V0Lm5hbWVdID0gZXZlbnQudGFyZ2V0LmNoZWNrZWQ7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRvcHRpb25zOiBvcHRpb25zXG5cdFx0fSk7XG5cdH0sXG5cdFNIQUNoYW5nZUhhbmRsZXI6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRzaGE6IGV2ZW50LnRhcmdldC52YWx1ZVxuXHRcdH0pO1xuXHR9LFxuXHRjaGFuZ2VIYW5kbGVyOiBmdW5jdGlvbihldmVudCkge1xuXHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdHN1bW1hcnk6IHRoaXMuZ2V0SW5pdGlhbFN1bW1hcnlTdGF0ZSgpXG5cdFx0fSk7XG5cblx0XHRpZihldmVudC50YXJnZXQudmFsdWUgPT09IFwiXCIpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRFdmVudHMucHVibGlzaCgnY2hhbmdlX2xvYWRpbmcnKTtcblxuXHRcdHZhciBzdW1tYXJ5RGF0YSA9IHtcblx0XHRcdHNoYTogUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLnNoYV9zZWxlY3Rvci5yZWZzLnNoYSkudmFsdWUsXG5cdFx0XHRTZWN1cml0eUlEOiB0aGlzLnByb3BzLlNlY3VyaXR5VG9rZW5cblx0XHR9O1xuXHRcdC8vIG1lcmdlIHRoZSAnYWR2YW5jZWQnIG9wdGlvbnMgaWYgdGhleSBhcmUgc2V0XG5cdFx0Zm9yICh2YXIgYXR0cm5hbWUgaW4gdGhpcy5zdGF0ZS5vcHRpb25zKSB7XG5cdFx0XHRpZih0aGlzLnN0YXRlLm9wdGlvbnMuaGFzT3duUHJvcGVydHkoYXR0cm5hbWUpKSB7XG5cdFx0XHRcdHN1bW1hcnlEYXRhW2F0dHJuYW1lXSA9IHRoaXMuc3RhdGUub3B0aW9uc1thdHRybmFtZV07XG5cdFx0XHR9XG5cdFx0fVxuXHRcdFEoJC5hamF4KHtcblx0XHRcdHR5cGU6IFwiUE9TVFwiLFxuXHRcdFx0ZGF0YVR5cGU6ICdqc29uJyxcblx0XHRcdHVybDogdGhpcy5wcm9wcy5jb250ZXh0LmVudlVybCArICcvZGVwbG95X3N1bW1hcnknLFxuXHRcdFx0ZGF0YTogc3VtbWFyeURhdGFcblx0XHR9KSkudGhlbihmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdFx0c3VtbWFyeTogZGF0YVxuXHRcdFx0fSk7XG5cdFx0XHRFdmVudHMucHVibGlzaCgnY2hhbmdlX2xvYWRpbmcvZG9uZScpO1xuXHRcdH0uYmluZCh0aGlzKSwgZnVuY3Rpb24oKXtcblx0XHRcdEV2ZW50cy5wdWJsaXNoKCdjaGFuZ2VfbG9hZGluZy9kb25lJyk7XG5cdFx0fSk7XG5cdH0sXG5cblx0c2hvd09wdGlvbnM6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnByb3BzLnRhYi5hZHZhbmNlZF9vcHRzID09PSAndHJ1ZSc7XG5cdH0sXG5cblx0c2hvd1ZlcmlmeUJ1dHRvbjogZnVuY3Rpb24oKSB7XG5cdFx0aWYodGhpcy5zaG93T3B0aW9ucygpKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMucHJvcHMudGFiLmZpZWxkX3R5cGUgPT0gJ3RleHRmaWVsZCc7XG5cdH0sXG5cblx0c2hhQ2hvc2VuOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKHRoaXMuc3RhdGUuc2hhICE9PSAnJyk7XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIGNsYXNzZXMgPSBIZWxwZXJzLmNsYXNzTmFtZXMoe1xuXHRcdFx0XCJ0YWItcGFuZVwiOiB0cnVlLFxuXHRcdFx0XCJjbGVhcmZpeFwiOiB0cnVlLFxuXHRcdFx0XCJhY3RpdmVcIiA6ICh0aGlzLnByb3BzLnNlbGVjdGVkVGFiID09IHRoaXMucHJvcHMudGFiLmlkKVxuXHRcdH0pO1xuXG5cdFx0Ly8gc2V0dXAgdGhlIGRyb3Bkb3duIG9yIHRoZSB0ZXh0IGlucHV0IGZvciBzZWxlY3RpbmcgYSBTSEFcblx0XHR2YXIgc2VsZWN0b3I7XG5cdFx0aWYgKHRoaXMucHJvcHMudGFiLmZpZWxkX3R5cGUgPT0gJ2Ryb3Bkb3duJykge1xuXHRcdFx0dmFyIGNoYW5nZUhhbmRsZXIgPSB0aGlzLmNoYW5nZUhhbmRsZXI7XG5cdFx0XHRpZih0aGlzLnNob3dWZXJpZnlCdXR0b24oKSkgeyBjaGFuZ2VIYW5kbGVyID0gdGhpcy5TSEFDaGFuZ2VIYW5kbGVyIH1cblx0XHRcdHNlbGVjdG9yID0gPFNlbGVjdG9yRHJvcGRvd24gcmVmPVwic2hhX3NlbGVjdG9yXCIgdGFiPXt0aGlzLnByb3BzLnRhYn0gY2hhbmdlSGFuZGxlcj17Y2hhbmdlSGFuZGxlcn0gLz5cblx0XHR9IGVsc2UgaWYgKHRoaXMucHJvcHMudGFiLmZpZWxkX3R5cGUgPT0gJ3RleHRmaWVsZCcpIHtcblx0XHRcdHNlbGVjdG9yID0gPFNlbGVjdG9yVGV4dCByZWY9XCJzaGFfc2VsZWN0b3JcIiB0YWI9e3RoaXMucHJvcHMudGFifSBjaGFuZ2VIYW5kbGVyPXt0aGlzLlNIQUNoYW5nZUhhbmRsZXJ9IC8+XG5cdFx0fVxuXG5cdFx0Ly8gJ0FkdmFuY2VkJyBvcHRpb25zXG5cdFx0dmFyIG9wdGlvbnMgPSBudWxsO1xuXHRcdGlmKHRoaXMuc2hvd09wdGlvbnMoKSkge1xuXHRcdFx0b3B0aW9ucyA9IDxBZHZhbmNlZE9wdGlvbnMgdGFiPXt0aGlzLnByb3BzLnRhYn0gY2hhbmdlSGFuZGxlcj17dGhpcy5PcHRpb25DaGFuZ2VIYW5kbGVyfSAvPlxuXHRcdH1cblxuXHRcdC8vICdUaGUgdmVyaWZ5IGJ1dHRvbidcblx0XHR2YXIgdmVyaWZ5QnV0dG9uID0gbnVsbDtcblx0XHRpZih0aGlzLnNob3dWZXJpZnlCdXR0b24oKSkge1xuXHRcdFx0dmVyaWZ5QnV0dG9uID0gPFZlcmlmeUJ1dHRvbiBkaXNhYmxlZD17IXRoaXMuc2hhQ2hvc2VuKCl9IGNoYW5nZUhhbmRsZXI9e3RoaXMuY2hhbmdlSGFuZGxlcn0gLz5cblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBpZD17XCJkZXBsb3ktdGFiLVwiK3RoaXMucHJvcHMudGFiLmlkfSBjbGFzc05hbWU9e2NsYXNzZXN9PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cInNlY3Rpb25cIj5cblx0XHRcdFx0XHQ8ZGl2IGh0bWxGb3I9e3RoaXMucHJvcHMudGFiLmZpZWxkX2lkfSBjbGFzc05hbWU9XCJoZWFkZXJcIj5cblx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzTmFtZT1cIm51bWJlckNpcmNsZVwiPjE8L3NwYW4+IHt0aGlzLnByb3BzLnRhYi5maWVsZF9sYWJlbH1cblx0XHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0XHR7c2VsZWN0b3J9XG5cdFx0XHRcdFx0e29wdGlvbnN9XG5cdFx0XHRcdFx0e3ZlcmlmeUJ1dHRvbn1cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdDxEZXBsb3lQbGFuIGNvbnRleHQ9e3RoaXMucHJvcHMuY29udGV4dH0gc3VtbWFyeT17dGhpcy5zdGF0ZS5zdW1tYXJ5fSAvPlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBTZWxlY3RvckRyb3Bkb3duID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0JChSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuc2hhKSkuc2VsZWN0Mih7XG5cdFx0XHQvLyBMb2FkIGRhdGEgaW50byB0aGUgc2VsZWN0Mi5cblx0XHRcdC8vIFRoZSBmb3JtYXQgc3VwcG9ydHMgb3B0Z3JvdXBzLCBhbmQgbG9va3MgbGlrZSB0aGlzOlxuXHRcdFx0Ly8gW3t0ZXh0OiAnb3B0Z3JvdXAgdGV4dCcsIGNoaWxkcmVuOiBbe2lkOiAnPHNoYT4nLCB0ZXh0OiAnPGlubmVyIHRleHQ+J31dfV1cblx0XHRcdGRhdGE6IHRoaXMucHJvcHMudGFiLmZpZWxkX2RhdGFcblx0XHR9KTtcblxuXHRcdC8vIFRyaWdnZXIgaGFuZGxlciBvbmx5IG5lZWRlZCBpZiB0aGVyZSBpcyBubyBleHBsaWNpdCBidXR0b24uXG5cdFx0aWYodGhpcy5wcm9wcy5jaGFuZ2VIYW5kbGVyKSB7XG5cdFx0XHQkKFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5zaGEpKS5zZWxlY3QyKCkub24oXCJjaGFuZ2VcIiwgdGhpcy5wcm9wcy5jaGFuZ2VIYW5kbGVyKTtcblx0XHR9XG5cdH0sXG5cblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHQvLyBGcm9tIGh0dHBzOi8vc2VsZWN0Mi5naXRodWIuaW8vZXhhbXBsZXMuaHRtbCBcIlRoZSBiZXN0IHdheSB0byBlbnN1cmUgdGhhdCBTZWxlY3QyIGlzIHVzaW5nIGEgcGVyY2VudCBiYXNlZFxuXHRcdC8vIHdpZHRoIGlzIHRvIGlubGluZSB0aGUgc3R5bGUgZGVjbGFyYXRpb24gaW50byB0aGUgdGFnXCIuXG5cdFx0dmFyIHN0eWxlID0ge3dpZHRoOiAnMTAwJSd9O1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZmllbGRcIj5cblx0XHRcdFx0XHQ8c2VsZWN0XG5cdFx0XHRcdFx0XHRyZWY9XCJzaGFcIlxuXHRcdFx0XHRcdFx0aWQ9e3RoaXMucHJvcHMudGFiLmZpZWxkX2lkfVxuXHRcdFx0XHRcdFx0bmFtZT1cInNoYVwiXG5cdFx0XHRcdFx0XHRjbGFzc05hbWU9XCJkcm9wZG93blwiXG5cdFx0XHRcdFx0XHRvbkNoYW5nZT17dGhpcy5wcm9wcy5jaGFuZ2VIYW5kbGVyfVxuXHRcdFx0XHRcdFx0c3R5bGU9e3N0eWxlfT5cblx0XHRcdFx0XHRcdDxvcHRpb24gdmFsdWU9XCJcIj5TZWxlY3Qge3RoaXMucHJvcHMudGFiLmZpZWxkX2lkfTwvb3B0aW9uPlxuXHRcdFx0XHRcdDwvc2VsZWN0PlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgU2VsZWN0b3JUZXh0ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybihcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZmllbGRcIj5cblx0XHRcdFx0PGlucHV0XG5cdFx0XHRcdFx0dHlwZT1cInRleHRcIlxuXHRcdFx0XHRcdHJlZj1cInNoYVwiXG5cdFx0XHRcdFx0aWQ9e3RoaXMucHJvcHMudGFiLmZpZWxkX2lkfVxuXHRcdFx0XHRcdG5hbWU9XCJzaGFcIlxuXHRcdFx0XHRcdGNsYXNzTmFtZT1cInRleHRcIlxuXHRcdFx0XHRcdG9uQ2hhbmdlPXt0aGlzLnByb3BzLmNoYW5nZUhhbmRsZXJ9XG5cdFx0XHRcdC8+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIFZlcmlmeUJ1dHRvbiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJcIj5cblx0XHRcdFx0PGJ1dHRvblxuXHRcdFx0XHRcdGRpc2FibGVkPXt0aGlzLnByb3BzLmRpc2FibGVkfVxuXHRcdFx0XHRcdHZhbHVlPVwiVmVyaWZ5IGRlcGxveW1lbnRcIlxuXHRcdFx0XHRcdGNsYXNzTmFtZT1cImJ0biBidG4tZGVmYXVsdFwiXG5cdFx0XHRcdFx0b25DbGljaz17dGhpcy5wcm9wcy5jaGFuZ2VIYW5kbGVyfT5cblx0XHRcdFx0XHRWZXJpZnkgZGVwbG95bWVudFxuXHRcdFx0XHQ8L2J1dHRvbj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgQWR2YW5jZWRPcHRpb25zID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJkZXBsb3ktb3B0aW9uc1wiPlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZpZWxkY2hlY2tib3hcIj5cblx0XHRcdFx0XHQ8bGFiZWw+XG5cdFx0XHRcdFx0XHQ8aW5wdXRcblx0XHRcdFx0XHRcdFx0dHlwZT1cImNoZWNrYm94XCJcblx0XHRcdFx0XHRcdFx0bmFtZT1cImZvcmNlX2Z1bGxcIlxuXHRcdFx0XHRcdFx0XHRvbkNoYW5nZT17dGhpcy5wcm9wcy5jaGFuZ2VIYW5kbGVyfVxuXHRcdFx0XHRcdFx0Lz5cblx0XHRcdFx0XHRcdEZvcmNlIGZ1bGwgZGVwbG95bWVudFxuXHRcdFx0XHRcdDwvbGFiZWw+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRGVwbG95bWVudERpYWxvZztcbiIsIi8qKlxuICogQSBzaW1wbGUgcHViIHN1YiBldmVudCBoYW5kbGVyIGZvciBpbnRlcmNvbXBvbmVudCBjb21tdW5pY2F0aW9uXG4gKi9cbnZhciB0b3BpY3MgPSB7fTtcbnZhciBoT1AgPSB0b3BpY3MuaGFzT3duUHJvcGVydHk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRzdWJzY3JpYmU6IGZ1bmN0aW9uKHRvcGljLCBsaXN0ZW5lcikge1xuXHRcdC8vIENyZWF0ZSB0aGUgdG9waWMncyBvYmplY3QgaWYgbm90IHlldCBjcmVhdGVkXG5cdFx0aWYoIWhPUC5jYWxsKHRvcGljcywgdG9waWMpKSB0b3BpY3NbdG9waWNdID0gW107XG5cblx0XHQvLyBBZGQgdGhlIGxpc3RlbmVyIHRvIHF1ZXVlXG5cdFx0dmFyIGluZGV4ID0gdG9waWNzW3RvcGljXS5wdXNoKGxpc3RlbmVyKSAtMTtcblxuXHRcdC8vIFByb3ZpZGUgaGFuZGxlIGJhY2sgZm9yIHJlbW92YWwgb2YgdG9waWNcblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVtb3ZlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0ZGVsZXRlIHRvcGljc1t0b3BpY11baW5kZXhdO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0cHVibGlzaDogZnVuY3Rpb24odG9waWMsIGluZm8pIHtcblx0XHQvLyBJZiB0aGUgdG9waWMgZG9lc24ndCBleGlzdCwgb3IgdGhlcmUncyBubyBsaXN0ZW5lcnMgaW4gcXVldWUsIGp1c3QgbGVhdmVcblx0XHRpZighaE9QLmNhbGwodG9waWNzLCB0b3BpYykpIHJldHVybjtcblxuXHRcdC8vIEN5Y2xlIHRocm91Z2ggdG9waWNzIHF1ZXVlLCBmaXJlIVxuXHRcdHRvcGljc1t0b3BpY10uZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRpdGVtKGluZm8gIT0gdW5kZWZpbmVkID8gaW5mbyA6IHt9KTtcblx0XHR9KTtcblx0fVxufTtcbiIsIi8qKlxuICogSGVscGVyIGNsYXNzIHRvIGNvbmNhdGluYXRlIHN0cmluZ3MgZGVwZWRpbmcgb24gYSB0cnVlIG9yIGZhbHNlLlxuICpcbiAqIEV4YW1wbGU6XG4gKiB2YXIgY2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG4gKiAgICAgXCJkZXBsb3ktZHJvcGRvd25cIjogdHJ1ZSxcbiAqICAgICBcImxvYWRpbmdcIjogZmFsc2UsXG4gKiAgICAgXCJvcGVuXCI6IHRydWUsXG4gKiB9KTtcbiAqXG4gKiB0aGVuIGNsYXNzZXMgd2lsbCBlcXVhbCBcImRlcGxveS1kcm9wZG93biBvcGVuXCJcbiAqXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Y2xhc3NOYW1lczogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBjbGFzc2VzID0gJyc7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBhcmcgPSBhcmd1bWVudHNbaV07XG5cdFx0XHRpZiAoIWFyZykgY29udGludWU7XG5cblx0XHRcdHZhciBhcmdUeXBlID0gdHlwZW9mIGFyZztcblxuXHRcdFx0aWYgKCdzdHJpbmcnID09PSBhcmdUeXBlIHx8ICdudW1iZXInID09PSBhcmdUeXBlKSB7XG5cdFx0XHRcdGNsYXNzZXMgKz0gJyAnICsgYXJnO1xuXG5cdFx0XHR9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuXHRcdFx0XHRjbGFzc2VzICs9ICcgJyArIGNsYXNzTmFtZXMuYXBwbHkobnVsbCwgYXJnKTtcblxuXHRcdFx0fSBlbHNlIGlmICgnb2JqZWN0JyA9PT0gYXJnVHlwZSkge1xuXHRcdFx0XHRmb3IgKHZhciBrZXkgaW4gYXJnKSB7XG5cdFx0XHRcdFx0aWYgKGFyZy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGFyZ1trZXldKSB7XG5cdFx0XHRcdFx0XHRjbGFzc2VzICs9ICcgJyArIGtleTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGNsYXNzZXMuc3Vic3RyKDEpO1xuXHR9XG59XG4iLCJcbi8qKlxuICogQGpzeCBSZWFjdC5ET01cbiAqL1xudmFyIFN1bW1hcnlUYWJsZSA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0aXNFbXB0eTogZnVuY3Rpb24ob2JqKSB7XG5cdFx0Zm9yICh2YXIga2V5IGluIG9iaikge1xuXHRcdFx0aWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIG9ialtrZXldKSB7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIHRydWU7XG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNoYW5nZXMgPSB0aGlzLnByb3BzLmNoYW5nZXM7XG5cdFx0aWYodGhpcy5pc0VtcHR5KGNoYW5nZXMpKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdFx0dmFyIGlkeCA9IDA7XG5cdFx0dmFyIHN1bW1hcnlMaW5lcyA9IE9iamVjdC5rZXlzKGNoYW5nZXMpLm1hcChmdW5jdGlvbihrZXkpIHtcblx0XHRcdGlkeCsrO1xuXG5cdFx0XHR2YXIgY29tcGFyZVVybCA9IG51bGw7XG5cdFx0XHRpZih0eXBlb2YgY2hhbmdlc1trZXldLmNvbXBhcmVVcmwgIT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdFx0Y29tcGFyZVVybCA9IGNoYW5nZXNba2V5XS5jb21wYXJlVXJsO1xuXHRcdFx0fVxuXG5cdFx0XHRpZih0eXBlb2YgY2hhbmdlc1trZXldLmRlc2NyaXB0aW9uIT09J3VuZGVmaW5lZCcpIHtcblxuXHRcdFx0XHRpZiAoY2hhbmdlc1trZXldLmRlc2NyaXB0aW9uIT09XCJcIikge1xuXHRcdFx0XHRcdHJldHVybiA8RGVzY3JpcHRpb25Pbmx5U3VtbWFyeUxpbmUga2V5PXtpZHh9IG5hbWU9e2tleX0gZGVzY3JpcHRpb249e2NoYW5nZXNba2V5XS5kZXNjcmlwdGlvbn0gLz5cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRyZXR1cm4gPFVuY2hhbmdlZFN1bW1hcnlMaW5lIGtleT17aWR4fSBuYW1lPXtrZXl9IHZhbHVlPVwiXCIgLz5cblx0XHRcdFx0fVxuXG5cdFx0XHR9IGVsc2UgaWYoY2hhbmdlc1trZXldLmZyb20gIT0gY2hhbmdlc1trZXldLnRvKSB7XG5cdFx0XHRcdHJldHVybiA8U3VtbWFyeUxpbmUga2V5PXtpZHh9IG5hbWU9e2tleX0gZnJvbT17Y2hhbmdlc1trZXldLmZyb219IHRvPXtjaGFuZ2VzW2tleV0udG99IGNvbXBhcmVVcmw9e2NvbXBhcmVVcmx9IC8+XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gPFVuY2hhbmdlZFN1bW1hcnlMaW5lIGtleT17aWR4fSBuYW1lPXtrZXl9IHZhbHVlPXtjaGFuZ2VzW2tleV0uZnJvbX0gLz5cblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8dGFibGUgY2xhc3NOYW1lPVwidGFibGUgdGFibGUtc3RyaXBlZCB0YWJsZS1ob3ZlclwiPlxuXHRcdFx0XHQ8dGhlYWQ+XG5cdFx0XHRcdFx0PHRyPlxuXHRcdFx0XHRcdFx0PHRoPiZuYnNwOzwvdGg+XG5cdFx0XHRcdFx0XHQ8dGg+Jm5ic3A7PC90aD5cblx0XHRcdFx0XHRcdDx0aCBjbGFzc05hbWU9XCJ0cmFuc2l0aW9uSWNvblwiPiZuYnNwOzwvdGg+XG5cdFx0XHRcdFx0XHQ8dGg+Jm5ic3A7PC90aD5cblx0XHRcdFx0XHRcdDx0aCBjbGFzc05hbWU9XCJjaGFuZ2VBY3Rpb25cIj4mbmJzcDs8L3RoPlxuXHRcdFx0XHRcdDwvdHI+XG5cdFx0XHRcdDwvdGhlYWQ+XG5cdFx0XHRcdDx0Ym9keT5cblx0XHRcdFx0XHR7c3VtbWFyeUxpbmVzfVxuXHRcdFx0XHQ8L3Rib2R5PlxuXHRcdFx0PC90YWJsZT5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIFN1bW1hcnlMaW5lID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBmcm9tID0gdGhpcy5wcm9wcy5mcm9tLFxuXHRcdFx0dG8gPSB0aGlzLnByb3BzLnRvO1xuXG5cdFx0Ly8gbmFpdmUgZ2l0IHNoYSBkZXRlY3Rpb25cblx0XHRpZihmcm9tICE9PSBudWxsICYmIGZyb20ubGVuZ3RoID09PSA0MCkge1xuXHRcdFx0ZnJvbSA9IGZyb20uc3Vic3RyaW5nKDAsNyk7XG5cdFx0fVxuXG5cdFx0Ly8gbmFpdmUgZ2l0IHNoYSBkZXRlY3Rpb25cblx0XHRpZih0byAhPT0gbnVsbCAmJiB0by5sZW5ndGggPT09IDQwKSB7XG5cdFx0XHR0byA9IHRvLnN1YnN0cmluZygwLDcpO1xuXHRcdH1cblxuXHRcdHZhciBjb21wYXJlVXJsID0gbnVsbDtcblx0XHRpZih0aGlzLnByb3BzLmNvbXBhcmVVcmwgIT09IG51bGwpIHtcblx0XHRcdGNvbXBhcmVVcmwgPSA8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPXt0aGlzLnByb3BzLmNvbXBhcmVVcmx9PlZpZXcgZGlmZjwvYT5cblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PHRyPlxuXHRcdFx0XHQ8dGggc2NvcGU9XCJyb3dcIj57dGhpcy5wcm9wcy5uYW1lfTwvdGg+XG5cdFx0XHRcdDx0ZD57ZnJvbX08L3RkPlxuXHRcdFx0XHQ8dGQ+PHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1hcnJvdy1yaWdodFwiIC8+PC90ZD5cblx0XHRcdFx0PHRkPnt0b308L3RkPlxuXHRcdFx0XHQ8dGQgY2xhc3NOYW1lPVwiY2hhbmdlQWN0aW9uXCI+e2NvbXBhcmVVcmx9PC90ZD5cblx0XHRcdDwvdHI+XG5cdFx0KVxuXHR9XG59KTtcblxudmFyIFVuY2hhbmdlZFN1bW1hcnlMaW5lID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBmcm9tID0gdGhpcy5wcm9wcy52YWx1ZTtcblx0XHQvLyBuYWl2ZSBnaXQgc2hhIGRldGVjdGlvblxuXHRcdGlmKGZyb20gIT09IG51bGwgJiYgZnJvbS5sZW5ndGggPT09IDQwKSB7XG5cdFx0XHRmcm9tID0gZnJvbS5zdWJzdHJpbmcoMCw3KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PHRyPlxuXHRcdFx0XHQ8dGggc2NvcGU9XCJyb3dcIj57dGhpcy5wcm9wcy5uYW1lfTwvdGg+XG5cdFx0XHRcdDx0ZD57ZnJvbX08L3RkPlxuXHRcdFx0XHQ8dGQ+Jm5ic3A7PC90ZD5cblx0XHRcdFx0PHRkPjxzcGFuIGNsYXNzTmFtZT1cImxhYmVsIGxhYmVsLXN1Y2Nlc3NcIj5VbmNoYW5nZWQ8L3NwYW4+PC90ZD5cblx0XHRcdFx0PHRkPiZuYnNwOzwvdGQ+XG5cdFx0XHQ8L3RyPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgRGVzY3JpcHRpb25Pbmx5U3VtbWFyeUxpbmUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDx0cj5cblx0XHRcdFx0PHRoIHNjb3BlPVwicm93XCI+e3RoaXMucHJvcHMubmFtZX08L3RoPlxuXHRcdFx0XHQ8dGQgY29sU3Bhbj1cIjRcIiBkYW5nZXJvdXNseVNldElubmVySFRNTD17e19faHRtbDogdGhpcy5wcm9wcy5kZXNjcmlwdGlvbn19IC8+XG5cdFx0XHQ8L3RyPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN1bW1hcnlUYWJsZTtcbiJdfQ==
