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
				), 
				React.createElement("div", {className: "fieldcheckbox"}, 
					React.createElement("label", null, 
						React.createElement("input", {
							type: "checkbox", 
							name: "force_norollback", 
							onChange: this.props.changeHandler}
						), 
						"Force no rollback"
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvc2hhcnZleS9TaXRlcy9kZXBsb3ktc2lsdmVyc3RyaXBlLWNvbS9kZXBsb3luYXV0L2pzL2RlcGxveV9wbGFuLmpzeCIsIi9Vc2Vycy9zaGFydmV5L1NpdGVzL2RlcGxveS1zaWx2ZXJzdHJpcGUtY29tL2RlcGxveW5hdXQvanMvZGVwbG95bWVudF9kaWFsb2cuanN4IiwiL1VzZXJzL3NoYXJ2ZXkvU2l0ZXMvZGVwbG95LXNpbHZlcnN0cmlwZS1jb20vZGVwbG95bmF1dC9qcy9ldmVudHMuanMiLCIvVXNlcnMvc2hhcnZleS9TaXRlcy9kZXBsb3ktc2lsdmVyc3RyaXBlLWNvbS9kZXBsb3luYXV0L2pzL2hlbHBlcnMuanMiLCIvVXNlcnMvc2hhcnZleS9TaXRlcy9kZXBsb3ktc2lsdmVyc3RyaXBlLWNvbS9kZXBsb3luYXV0L2pzL3BsYXRmb3JtLmpzeCIsIi9Vc2Vycy9zaGFydmV5L1NpdGVzL2RlcGxveS1zaWx2ZXJzdHJpcGUtY29tL2RlcGxveW5hdXQvanMvc3VtbWFyeV90YWJsZS5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQSxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDcEMsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3RDLElBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDOztBQUVsRCxJQUFJLGdDQUFnQywwQkFBQTtDQUNuQyxVQUFVLEVBQUUsSUFBSTtDQUNoQixjQUFjLEVBQUUsSUFBSTtDQUNwQixlQUFlLEVBQUUsV0FBVztFQUMzQixPQUFPO0dBQ04sZUFBZSxFQUFFLEtBQUs7R0FDdEIsZUFBZSxFQUFFLEtBQUs7R0FDdEIsV0FBVyxFQUFFLEtBQUs7R0FDbEI7RUFDRDtDQUNELGlCQUFpQixFQUFF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RUFBQTtJQUNILG9CQUFBLElBQUcsRUFBQSxDQUFBLENBQUMsS0FBQSxFQUFLLENBQUMsS0FBTSxDQUFBLEVBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFVLENBQUEsRUFBQTtJQUN0QyxvQkFBQSxJQUFHLEVBQUEsSUFBQyxFQUFDLElBQVUsQ0FBQSxFQUFBO0lBQ2Ysb0JBQUEsSUFBRyxFQUFBLElBQUMsRUFBQSxHQUFXLENBQUEsRUFBQTtJQUNmLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUEsb0JBQUEsTUFBSyxFQUFBLENBQUEsQ0FBQyxTQUFBLEVBQVMsQ0FBQyxxQkFBc0IsQ0FBQSxFQUFBLFdBQWdCLENBQUssQ0FBQSxFQUFBO0lBQy9ELG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUEsR0FBVyxDQUFBO0dBQ1gsQ0FBQTtJQUNKO0VBQ0Y7QUFDRixDQUFDLENBQUMsQ0FBQzs7QUFFSCxJQUFJLGdEQUFnRCwwQ0FBQTtDQUNuRCxNQUFNLEVBQUUsV0FBVztFQUNsQjtHQUNDLG9CQUFBLElBQUcsRUFBQSxJQUFDLEVBQUE7SUFDSCxvQkFBQSxJQUFHLEVBQUEsQ0FBQSxDQUFDLEtBQUEsRUFBSyxDQUFDLEtBQU0sQ0FBQSxFQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBVSxDQUFBLEVBQUE7SUFDdEMsb0JBQUEsSUFBRyxFQUFBLENBQUEsQ0FBQyxPQUFBLEVBQU8sQ0FBQyxHQUFBLEVBQUcsQ0FBQyx1QkFBQSxFQUF1QixDQUFFLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFFLENBQUEsQ0FBRyxDQUFBO0dBQ3pFLENBQUE7SUFDSjtFQUNGO0FBQ0YsQ0FBQyxDQUFDLENBQUM7O0FBRUgsTUFBTSxDQUFDLE9BQU8sR0FBRyxZQUFZLENBQUMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEV2ZW50cyA9IHJlcXVpcmUoJy4vZXZlbnRzLmpzJyk7XG52YXIgSGVscGVycyA9IHJlcXVpcmUoJy4vaGVscGVycy5qcycpO1xudmFyIFN1bW1hcnlUYWJsZSA9IHJlcXVpcmUoJy4vc3VtbWFyeV90YWJsZS5qc3gnKTtcblxudmFyIERlcGxveVBsYW4gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGxvYWRpbmdTdWI6IG51bGwsXG5cdGxvYWRpbmdEb25lU3ViOiBudWxsLFxuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRsb2FkaW5nX2NoYW5nZXM6IGZhbHNlLFxuXHRcdFx0ZGVwbG95X2Rpc2FibGVkOiBmYWxzZSxcblx0XHRcdGRlcGxveUhvdmVyOiBmYWxzZVxuXHRcdH1cblx0fSxcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHQvLyByZWdpc3RlciBzdWJzY3JpYmVyc1xuXHRcdHRoaXMubG9hZGluZ1N1YiA9IEV2ZW50cy5zdWJzY3JpYmUoJ2NoYW5nZV9sb2FkaW5nJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdGxvYWRpbmdfY2hhbmdlczogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdFx0dGhpcy5sb2FkaW5nRG9uZVN1YiA9IEV2ZW50cy5zdWJzY3JpYmUoJ2NoYW5nZV9sb2FkaW5nL2RvbmUnLCBmdW5jdGlvbiAoKSB7XG5cdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0bG9hZGluZ19jaGFuZ2VzOiBmYWxzZVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdH0sXG5cdGRlcGxveUhhbmRsZXI6IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR0aGlzLnNldFN0YXRlKHtcblx0XHRcdGRlcGxveV9kaXNhYmxlZDogdHJ1ZVxuXHRcdH0pO1xuXG5cdFx0USgkLmFqYXgoe1xuXHRcdFx0dHlwZTogXCJQT1NUXCIsXG5cdFx0XHRkYXRhVHlwZTogJ2pzb24nLFxuXHRcdFx0dXJsOiB0aGlzLnByb3BzLmNvbnRleHQuZW52VXJsICsgJy9zdGFydC1kZXBsb3knLFxuXHRcdFx0ZGF0YToge1xuXHRcdFx0XHQvLyBQYXNzIHRoZSBzdHJhdGVneSBvYmplY3QgdGhlIHVzZXIgaGFzIGp1c3Qgc2lnbmVkIG9mZiBiYWNrIHRvIHRoZSBiYWNrZW5kLlxuXHRcdFx0XHQnc3RyYXRlZ3knOiB0aGlzLnByb3BzLnN1bW1hcnksXG5cdFx0XHRcdCdTZWN1cml0eUlEJzogdGhpcy5wcm9wcy5zdW1tYXJ5LlNlY3VyaXR5SURcblx0XHRcdH1cblx0XHR9KSkudGhlbihmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHR3aW5kb3cubG9jYXRpb24gPSBkYXRhLnVybDtcblx0XHR9LCBmdW5jdGlvbihkYXRhKXtcblx0XHRcdGNvbnNvbGUuZXJyb3IoZGF0YSk7XG5cdFx0fSk7XG5cdH0sXG5cdG1vdXNlRW50ZXJIYW5kbGVyOiBmdW5jdGlvbihldmVudCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe2RlcGxveUhvdmVyOiB0cnVlfSk7XG5cdH0sXG5cdG1vdXNlTGVhdmVIYW5kbGVyOiBmdW5jdGlvbihldmVudCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe2RlcGxveUhvdmVyOiBmYWxzZX0pO1xuXHR9LFxuXHRjYW5EZXBsb3k6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAodGhpcy5wcm9wcy5zdW1tYXJ5LnZhbGlkYXRpb25Db2RlPT09XCJzdWNjZXNzXCIgfHwgdGhpcy5wcm9wcy5zdW1tYXJ5LnZhbGlkYXRpb25Db2RlPT09XCJ3YXJuaW5nXCIpO1xuXHR9LFxuXHRpc0VtcHR5OiBmdW5jdGlvbihvYmopIHtcblx0XHRmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG5cdFx0XHRpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkgJiYgb2JqW2tleV0pIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblx0c2hvd05vQ2hhbmdlc01lc3NhZ2U6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzdW1tYXJ5ID0gdGhpcy5wcm9wcy5zdW1tYXJ5O1xuXHRcdGlmKHN1bW1hcnkuaW5pdGlhbFN0YXRlID09PSB0cnVlKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHRcdGlmKHN1bW1hcnkubWVzc2FnZXMgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cdFx0cmV0dXJuICh0aGlzLmlzRW1wdHkoc3VtbWFyeS5jaGFuZ2VzKSAmJiBzdW1tYXJ5Lm1lc3NhZ2VzLmxlbmd0aCA9PT0gMCk7XG5cdH0sXG5cdGFjdGlvblRpdGxlOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgYWN0aW9uVGl0bGUgPSB0aGlzLnByb3BzLnN1bW1hcnkuYWN0aW9uVGl0bGU7XG5cdFx0aWYgKHR5cGVvZiBhY3Rpb25UaXRsZSA9PT0gJ3VuZGVmaW5lZCcgfHwgYWN0aW9uVGl0bGUgPT09ICcnICkge1xuXHRcdFx0cmV0dXJuICdNYWtlIGEgc2VsZWN0aW9uJztcblx0XHR9XG5cdFx0cmV0dXJuIHRoaXMucHJvcHMuc3VtbWFyeS5hY3Rpb25UaXRsZTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbWVzc2FnZXMgPSB0aGlzLnByb3BzLnN1bW1hcnkubWVzc2FnZXM7XG5cdFx0aWYgKHRoaXMuc2hvd05vQ2hhbmdlc01lc3NhZ2UoKSkge1xuXHRcdFx0bWVzc2FnZXMgPSBbe1xuXHRcdFx0XHR0ZXh0OiBcIlRoZXJlIGFyZSBubyBjaGFuZ2VzIGJ1dCB5b3UgY2FuIGRlcGxveSBhbnl3YXkgaWYgeW91IHdpc2guXCIsXG5cdFx0XHRcdGNvZGU6IFwic3VjY2Vzc1wiXG5cdFx0XHR9XTtcblx0XHR9XG5cblx0XHR2YXIgZGVwbG95QWN0aW9uO1xuXHRcdGlmKHRoaXMuY2FuRGVwbG95KCkpIHtcblx0XHRcdGRlcGxveUFjdGlvbiA9IChcblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZWN0aW9uXCJcblx0XHRcdFx0XHRvbk1vdXNlRW50ZXI9e3RoaXMubW91c2VFbnRlckhhbmRsZXJ9XG5cdFx0XHRcdFx0b25Nb3VzZUxlYXZlPXt0aGlzLm1vdXNlTGVhdmVIYW5kbGVyfT5cblx0XHRcdFx0XHRcdDxidXR0b25cblx0XHRcdFx0XHRcdFx0dmFsdWU9XCJDb25maXJtIERlcGxveW1lbnRcIlxuXHRcdFx0XHRcdFx0XHRjbGFzc05hbWU9XCJkZXBsb3kgcHVsbC1sZWZ0XCJcblx0XHRcdFx0XHRcdFx0ZGlzYWJsZWQ9e3RoaXMuc3RhdGUuZGVwbG95X2Rpc2FibGVkfVxuXHRcdFx0XHRcdFx0XHRvbkNsaWNrPXt0aGlzLmRlcGxveUhhbmRsZXJ9PlxuXHRcdFx0XHRcdFx0XHR7dGhpcy5hY3Rpb25UaXRsZSgpfVxuXHRcdFx0XHRcdFx0PC9idXR0b24+XG5cdFx0XHRcdFx0XHQ8UXVpY2tTdW1tYXJ5IGFjdGl2YXRlZD17dGhpcy5zdGF0ZS5kZXBsb3lIb3Zlcn0gY29udGV4dD17dGhpcy5wcm9wcy5jb250ZXh0fSBzdW1tYXJ5PXt0aGlzLnByb3BzLnN1bW1hcnl9IC8+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0KTtcblx0XHR9XG5cblx0XHR2YXIgaGVhZGVyQ2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG5cdFx0XHRoZWFkZXI6IHRydWUsXG5cdFx0XHRpbmFjdGl2ZTogIXRoaXMuY2FuRGVwbG95KCksXG5cdFx0XHRsb2FkaW5nOiB0aGlzLnN0YXRlLmxvYWRpbmdfY2hhbmdlc1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuKFxuXHRcdFx0PGRpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZWN0aW9uXCI+XG5cdFx0XHRcdFx0PGRpdiBjbGFzc05hbWU9e2hlYWRlckNsYXNzZXN9PlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwic3RhdHVzLWljb25cIj48L3NwYW4+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJudW1iZXJDaXJjbGVcIj4yPC9zcGFuPiBSZXZpZXcgY2hhbmdlc1xuXHRcdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHRcdDxNZXNzYWdlTGlzdCBtZXNzYWdlcz17bWVzc2FnZXN9IC8+XG5cdFx0XHRcdFx0PFN1bW1hcnlUYWJsZSBjaGFuZ2VzPXt0aGlzLnByb3BzLnN1bW1hcnkuY2hhbmdlc30gLz5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdHtkZXBsb3lBY3Rpb259XG5cdFx0XHQ8L2Rpdj5cblx0XHQpXG5cdH1cbn0pO1xuXG52YXIgUXVpY2tTdW1tYXJ5ID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0eXBlID0gKHRoaXMucHJvcHMuc3VtbWFyeS5hY3Rpb25Db2RlPT09J2Zhc3QnID8gJ2NvZGUtb25seScgOiAnZnVsbCcpO1xuXHRcdHZhciBlc3RpbWF0ZSA9IFtdO1xuXHRcdGlmICh0aGlzLnByb3BzLnN1bW1hcnkuZXN0aW1hdGVkVGltZSAmJiB0aGlzLnByb3BzLnN1bW1hcnkuZXN0aW1hdGVkVGltZT4wKSB7XG5cdFx0XHRlc3RpbWF0ZSA9IFtcblx0XHRcdFx0PGR0PkR1cmF0aW9uOjwvZHQ+LFxuXHRcdFx0XHQ8ZGQ+e3RoaXMucHJvcHMuc3VtbWFyeS5lc3RpbWF0ZWRUaW1lfSBtaW4gYXBwcm94LjwvZGQ+XG5cdFx0XHRdO1xuXHRcdH1cblxuXHRcdHZhciBkbENsYXNzZXMgPSBIZWxwZXJzLmNsYXNzTmFtZXMoe1xuXHRcdFx0YWN0aXZhdGVkOiB0aGlzLnByb3BzLmFjdGl2YXRlZCxcblx0XHRcdCdxdWljay1zdW1tYXJ5JzogdHJ1ZVxuXHRcdH0pO1xuXG5cdFx0dmFyIG1vcmVJbmZvID0gbnVsbDtcblx0XHRpZiAodHlwZW9mIHRoaXMucHJvcHMuY29udGV4dC5kZXBsb3lIZWxwIT09J3VuZGVmaW5lZCcgJiYgdGhpcy5wcm9wcy5jb250ZXh0LmRlcGxveUhlbHApIHtcblx0XHRcdG1vcmVJbmZvID0gKFxuXHRcdFx0XHQ8YSB0YXJnZXQ9XCJfYmxhbmtcIiBjbGFzc05hbWU9XCJzbWFsbFwiIGhyZWY9e3RoaXMucHJvcHMuY29udGV4dC5kZXBsb3lIZWxwfT5tb3JlIGluZm88L2E+XG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdGlmICh0aGlzLnByb3BzLmNvbnRleHQuc2l0ZVVybCkge1xuXHRcdFx0dmFyIGVudiA9IDxhIHRhcmdldD1cIl9ibGFua1wiIGhyZWY9e3RoaXMucHJvcHMuY29udGV4dC5zaXRlVXJsfT57dGhpcy5wcm9wcy5jb250ZXh0LmVudk5hbWV9PC9hPjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIGVudiA9IDxzcGFuPnt0aGlzLnByb3BzLmNvbnRleHQuZW52TmFtZX08L3NwYW4+O1xuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGwgY2xhc3NOYW1lPXtkbENsYXNzZXN9PlxuXHRcdFx0XHQ8ZHQ+RW52aXJvbm1lbnQ6PC9kdD5cblx0XHRcdFx0PGRkPntlbnZ9PC9kZD5cblx0XHRcdFx0PGR0PkRlcGxveSB0eXBlOjwvZHQ+XG5cdFx0XHRcdDxkZD57dHlwZX0ge21vcmVJbmZvfTwvZGQ+XG5cdFx0XHRcdHtlc3RpbWF0ZX1cblx0XHRcdDwvZGw+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBNZXNzYWdlTGlzdCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRpZih0aGlzLnByb3BzLm1lc3NhZ2VzLmxlbmd0aCA8IDEpIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblx0XHRpZih0eXBlb2YgdGhpcy5wcm9wcy5tZXNzYWdlcyA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblx0XHR2YXIgaWR4ID0gMDtcblx0XHR2YXIgbWVzc2FnZXMgPSB0aGlzLnByb3BzLm1lc3NhZ2VzLm1hcChmdW5jdGlvbihtZXNzYWdlKSB7XG5cdFx0XHRpZHgrKztcblx0XHRcdHJldHVybiA8TWVzc2FnZSBrZXk9e2lkeH0gbWVzc2FnZT17bWVzc2FnZX0gLz5cblx0XHR9KTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdj5cblx0XHRcdFx0e21lc3NhZ2VzfVxuXHRcdFx0PC9kaXY+XG5cdFx0KVxuXHR9XG59KTtcblxudmFyIE1lc3NhZ2UgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNsYXNzTWFwID0ge1xuXHRcdFx0J2Vycm9yJzogJ2FsZXJ0IGFsZXJ0LWRhbmdlcicsXG5cdFx0XHQnd2FybmluZyc6ICdhbGVydCBhbGVydC13YXJuaW5nJyxcblx0XHRcdCdzdWNjZXNzJzogJ2FsZXJ0IGFsZXJ0LWluZm8nXG5cdFx0fTtcblx0XHR2YXIgY2xhc3NuYW1lPWNsYXNzTWFwW3RoaXMucHJvcHMubWVzc2FnZS5jb2RlXTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9e2NsYXNzbmFtZX0gcm9sZT1cImFsZXJ0XCJcblx0XHRcdFx0ZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3tfX2h0bWw6IHRoaXMucHJvcHMubWVzc2FnZS50ZXh0fX0gLz5cblx0XHQpXG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERlcGxveVBsYW47XG4iLCJ2YXIgRXZlbnRzID0gcmVxdWlyZSgnLi9ldmVudHMuanMnKTtcbnZhciBIZWxwZXJzID0gcmVxdWlyZSgnLi9oZWxwZXJzLmpzJyk7XG52YXIgRGVwbG95UGxhbiA9IHJlcXVpcmUoJy4vZGVwbG95X3BsYW4uanN4Jyk7XG5cbnZhciBEZXBsb3ltZW50RGlhbG9nID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG5cdGxvYWRpbmdTdWI6IG51bGwsXG5cblx0bG9hZGluZ0RvbmVTdWI6IG51bGwsXG5cblx0ZXJyb3JTdWI6IG51bGwsXG5cblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0bG9hZGluZzogZmFsc2UsXG5cdFx0XHRsb2FkaW5nVGV4dDogXCJcIixcblx0XHRcdGVycm9yVGV4dDogXCJcIixcblx0XHRcdGZldGNoZWQ6IHRydWUsXG5cdFx0XHRsYXN0X2ZldGNoZWQ6IFwiXCJcblx0XHR9O1xuXHR9LFxuXHRjb21wb25lbnREaWRNb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdC8vIGFkZCBzdWJzY3JpYmVyc1xuXHRcdHRoaXMubG9hZGluZ1N1YiA9IEV2ZW50cy5zdWJzY3JpYmUoJ2xvYWRpbmcnLCBmdW5jdGlvbih0ZXh0KSB7XG5cdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0bG9hZGluZzogdHJ1ZSxcblx0XHRcdFx0c3VjY2VzczogZmFsc2UsXG5cdFx0XHRcdGxvYWRpbmdUZXh0OiB0ZXh0XG5cdFx0XHR9KTtcblx0XHR9KTtcblx0XHR0aGlzLmxvYWRpbmdEb25lU3ViID0gRXZlbnRzLnN1YnNjcmliZSgnbG9hZGluZy9kb25lJywgZnVuY3Rpb24oKSB7XG5cdFx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdFx0bG9hZGluZzogZmFsc2UsXG5cdFx0XHRcdGxvYWRpbmdUZXh0OiAnJyxcblx0XHRcdFx0c3VjY2VzczogdHJ1ZVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cdFx0dGhpcy5lcnJvclN1YiA9IEV2ZW50cy5zdWJzY3JpYmUoJ2Vycm9yJywgZnVuY3Rpb24odGV4dCkge1xuXHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdGVycm9yVGV4dDogdGV4dCxcblx0XHRcdFx0bG9hZGluZzogZmFsc2UsXG5cdFx0XHRcdGxvYWRpbmdUZXh0OiAnJyxcblx0XHRcdFx0c3VjY2VzczogZmFsc2Vcblx0XHRcdH0pO1xuXHRcdH0pO1xuXHR9LFxuXHRjb21wb25lbnRXaWxsVW5tb3VudDogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gcmVtb3ZlIHN1YnNjcmliZXJzXG5cdFx0dGhpcy5sb2FkaW5nU3ViLnJlbW92ZSgpO1xuXHRcdHRoaXMubG9hZGluZ0RvbmVTdWIucmVtb3ZlKCk7XG5cdFx0dGhpcy5lcnJvclN1Yi5yZW1vdmUoKTtcblx0fSxcblx0aGFuZGxlQ2xpY2s6IGZ1bmN0aW9uKGUpIHtcblx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0RXZlbnRzLnB1Ymxpc2goJ2xvYWRpbmcnLCBcIkZldGNoaW5nIGxhdGVzdCBjb2Rl4oCmXCIpO1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0ZmV0Y2hlZDogZmFsc2Vcblx0XHR9KTtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0USgkLmFqYXgoe1xuXHRcdFx0dHlwZTogXCJQT1NUXCIsXG5cdFx0XHRkYXRhVHlwZTogJ2pzb24nLFxuXHRcdFx0dXJsOiB0aGlzLnByb3BzLmNvbnRleHQucHJvamVjdFVybCArICcvZmV0Y2gnXG5cdFx0fSkpXG5cdFx0XHQudGhlbih0aGlzLndhaXRGb3JGZXRjaFRvQ29tcGxldGUsIHRoaXMuZmV0Y2hTdGF0dXNFcnJvcilcblx0XHRcdC50aGVuKGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRFdmVudHMucHVibGlzaCgnbG9hZGluZy9kb25lJyk7XG5cdFx0XHRcdHNlbGYuc2V0U3RhdGUoe1xuXHRcdFx0XHRcdGZldGNoZWQ6IHRydWVcblx0XHRcdFx0fSlcblx0XHRcdH0pLmNhdGNoKHRoaXMuZmV0Y2hTdGF0dXNFcnJvcikuZG9uZSgpO1xuXHR9LFxuXHR3YWl0Rm9yRmV0Y2hUb0NvbXBsZXRlOmZ1bmN0aW9uIChmZXRjaERhdGEpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0RmV0Y2hTdGF0dXMoZmV0Y2hEYXRhKS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG5cdFx0XHRpZiAoZGF0YS5zdGF0dXMgPT09IFwiQ29tcGxldGVcIikge1xuXHRcdFx0XHRyZXR1cm4gZGF0YTtcblx0XHRcdH1cblx0XHRcdGlmIChkYXRhLnN0YXR1cyA9PT0gXCJGYWlsZWRcIikge1xuXHRcdFx0XHRyZXR1cm4gJC5EZWZlcnJlZChmdW5jdGlvbiAoZCkge1xuXHRcdFx0XHRcdHJldHVybiBkLnJlamVjdChkYXRhKTtcblx0XHRcdFx0fSkucHJvbWlzZSgpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHNlbGYud2FpdEZvckZldGNoVG9Db21wbGV0ZShmZXRjaERhdGEpO1xuXHRcdH0pO1xuXHR9LFxuXHRnZXRGZXRjaFN0YXR1czogZnVuY3Rpb24gKGZldGNoRGF0YSkge1xuXHRcdHJldHVybiBRKCQuYWpheCh7XG5cdFx0XHR0eXBlOiBcIkdFVFwiLFxuXHRcdFx0dXJsOiBmZXRjaERhdGEuaHJlZixcblx0XHRcdGRhdGFUeXBlOiAnanNvbidcblx0XHR9KSk7XG5cdH0sXG5cdGZldGNoU3RhdHVzRXJyb3I6IGZ1bmN0aW9uKGRhdGEpIHtcblx0XHR2YXIgbWVzc2FnZSAgPSAnVW5rbm93biBlcnJvcic7XG5cdFx0aWYodHlwZW9mIGRhdGEucmVzcG9uc2VUZXh0ICE9PSAndW5kZWZpbmVkJykge1xuXHRcdFx0bWVzc2FnZSA9IGRhdGEucmVzcG9uc2VUZXh0O1xuXHRcdH0gZWxzZSBpZiAodHlwZW9mIGRhdGEubWVzc2FnZSAhPT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdG1lc3NhZ2UgPSBkYXRhLm1lc3NhZ2U7XG5cdFx0fVxuXHRcdEV2ZW50cy5wdWJsaXNoKCdlcnJvcicsIG1lc3NhZ2UpO1xuXHR9LFxuXHRsYXN0RmV0Y2hlZEhhbmRsZXI6IGZ1bmN0aW9uKHRpbWVfYWdvKSB7XG5cdFx0dGhpcy5zZXRTdGF0ZSh7bGFzdF9mZXRjaGVkOiB0aW1lX2Fnb30pO1xuXHR9LFxuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjbGFzc2VzID0gSGVscGVycy5jbGFzc05hbWVzKHtcblx0XHRcdFwiZGVwbG95LWRyb3Bkb3duXCI6IHRydWUsXG5cdFx0XHRcImxvYWRpbmdcIjogdGhpcy5zdGF0ZS5sb2FkaW5nLFxuXHRcdFx0XCJzdWNjZXNzXCI6IHRoaXMuc3RhdGUuc3VjY2Vzc1xuXHRcdH0pO1xuXG5cdFx0dmFyIGZvcm07XG5cblx0XHRpZih0aGlzLnN0YXRlLmVycm9yVGV4dCAhPT0gXCJcIikge1xuXHRcdFx0Zm9ybSA9IDxFcnJvck1lc3NhZ2VzIG1lc3NhZ2U9e3RoaXMuc3RhdGUuZXJyb3JUZXh0fSAvPlxuXHRcdH0gZWxzZSBpZih0aGlzLnN0YXRlLmZldGNoZWQpIHtcblx0XHRcdGZvcm0gPSA8RGVwbG95Rm9ybSBjb250ZXh0PXt0aGlzLnByb3BzLmNvbnRleHR9IGRhdGE9e3RoaXMucHJvcHMuZGF0YX0gbGFzdEZldGNoZWRIYW5kbGVyPXt0aGlzLmxhc3RGZXRjaGVkSGFuZGxlcn0gLz5cblx0XHR9IGVsc2UgaWYgKHRoaXMuc3RhdGUubG9hZGluZykge1xuXHRcdFx0Zm9ybSA9IDxMb2FkaW5nRGVwbG95Rm9ybSBtZXNzYWdlPVwiRmV0Y2hpbmcgbGF0ZXN0IGNvZGUmaGVsbGlwO1wiIC8+XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXY+XG5cdFx0XHRcdDxkaXYgY2xhc3NOYW1lPXtjbGFzc2VzfSBvbkNsaWNrPXt0aGlzLmhhbmRsZUNsaWNrfT5cblx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJzdGF0dXMtaWNvblwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvc3Bhbj5cblx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJ0aW1lXCI+bGFzdCB1cGRhdGVkIHt0aGlzLnN0YXRlLmxhc3RfZmV0Y2hlZH08L3NwYW4+XG5cdFx0XHRcdFx0PEVudmlyb25tZW50TmFtZSBlbnZpcm9ubWVudE5hbWU9e3RoaXMucHJvcHMuY29udGV4dC5lbnZOYW1lfSAvPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0e2Zvcm19XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIExvYWRpbmdEZXBsb3lGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImRlcGxveS1mb3JtLWxvYWRpbmdcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJpY29uLWhvbGRlclwiPlxuXHRcdFx0XHRcdDxpIGNsYXNzTmFtZT1cImZhIGZhLWNvZyBmYS1zcGluXCI+PC9pPlxuXHRcdFx0XHRcdDxzcGFuPnt0aGlzLnByb3BzLm1lc3NhZ2V9PC9zcGFuPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgRXJyb3JNZXNzYWdlcyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGRpdiBjbGFzc05hbWU9XCJkZXBsb3ktZHJvcGRvd24tZXJyb3JzXCI+XG5cdFx0XHRcdHt0aGlzLnByb3BzLm1lc3NhZ2V9XG5cdFx0XHQ8L2Rpdj5cblx0XHQpXG5cdH1cbn0pO1xuXG4vKipcbiAqIEVudmlyb25tZW50TmFtZVxuICovXG52YXIgRW52aXJvbm1lbnROYW1lID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PHNwYW4gY2xhc3NOYW1lPVwiZW52aXJvbm1lbnQtbmFtZVwiPlxuXHRcdFx0XHQ8aSBjbGFzc05hbWU9XCJmYSBmYS1yb2NrZXRcIj4mbmJzcDs8L2k+XG5cdFx0XHRcdERlcGxveW1lbnQgb3B0aW9ucyA8c3BhbiBjbGFzc05hbWU9XCJoaWRkZW4teHNcIj5mb3Ige3RoaXMucHJvcHMuZW52aXJvbm1lbnROYW1lfTwvc3Bhbj5cblx0XHRcdDwvc3Bhbj5cblx0XHQpO1xuXHR9XG59KTtcblxuLyoqXG4gKiBEZXBsb3lGb3JtXG4gKi9cbnZhciBEZXBsb3lGb3JtID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRnZXRJbml0aWFsU3RhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRzZWxlY3RlZFRhYjogMSxcblx0XHRcdGRhdGE6IFtdXG5cdFx0fTtcblx0fSxcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZ2l0RGF0YSgpO1xuXHR9LFxuXG5cdGdpdERhdGE6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZWxmID0gdGhpcztcblx0XHRzZWxmLnNldFN0YXRlKHtcblx0XHRcdGxvYWRpbmc6IHRydWVcblx0XHR9KTtcblx0XHRRKCQuYWpheCh7XG5cdFx0XHR0eXBlOiBcIlBPU1RcIixcblx0XHRcdGRhdGFUeXBlOiAnanNvbicsXG5cdFx0XHR1cmw6IHRoaXMucHJvcHMuY29udGV4dC5lbnZVcmwgKyAnL2dpdF9yZXZpc2lvbnMnXG5cdFx0fSkpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0c2VsZi5zZXRTdGF0ZSh7XG5cdFx0XHRcdGxvYWRpbmc6IGZhbHNlLFxuXHRcdFx0XHRkYXRhOiBkYXRhLlRhYnNcblx0XHRcdH0pO1xuXHRcdFx0c2VsZi5wcm9wcy5sYXN0RmV0Y2hlZEhhbmRsZXIoZGF0YS5sYXN0X2ZldGNoZWQpO1xuXHRcdH0sIGZ1bmN0aW9uKGRhdGEpe1xuXHRcdFx0RXZlbnRzLnB1Ymxpc2goJ2Vycm9yJywgZGF0YSk7XG5cdFx0fSk7XG5cdH0sXG5cblx0c2VsZWN0SGFuZGxlcjogZnVuY3Rpb24oaWQpIHtcblx0XHR0aGlzLnNldFN0YXRlKHtzZWxlY3RlZFRhYjogaWR9KTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0aWYodGhpcy5zdGF0ZS5sb2FkaW5nKSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQ8TG9hZGluZ0RlcGxveUZvcm0gbWVzc2FnZT1cIkxvYWRpbmcmaGVsbGlwO1wiIC8+XG5cdFx0XHQpO1xuXHRcdH1cblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImRlcGxveS1mb3JtLW91dGVyIGNsZWFyZml4XCI+XG5cdFx0XHRcdDxmb3JtIGNsYXNzTmFtZT1cImZvcm0taW5saW5lIGRlcGxveS1mb3JtXCIgYWN0aW9uPVwiUE9TVFwiIGFjdGlvbj1cIiNcIj5cblx0XHRcdFx0XHQ8RGVwbG95VGFiU2VsZWN0b3IgZGF0YT17dGhpcy5zdGF0ZS5kYXRhfSBvblNlbGVjdD17dGhpcy5zZWxlY3RIYW5kbGVyfSBzZWxlY3RlZFRhYj17dGhpcy5zdGF0ZS5zZWxlY3RlZFRhYn0gLz5cblx0XHRcdFx0XHQ8RGVwbG95VGFicyBjb250ZXh0PXt0aGlzLnByb3BzLmNvbnRleHR9IGRhdGE9e3RoaXMuc3RhdGUuZGF0YX0gc2VsZWN0ZWRUYWI9e3RoaXMuc3RhdGUuc2VsZWN0ZWRUYWJ9IFNlY3VyaXR5VG9rZW49e3RoaXMuc3RhdGUuU2VjdXJpdHlUb2tlbn0gLz5cblx0XHRcdFx0PC9mb3JtPlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbi8qKlxuICogRGVwbG95VGFiU2VsZWN0b3JcbiAqL1xudmFyIERlcGxveVRhYlNlbGVjdG9yID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgc2VsZiA9IHRoaXM7XG5cdFx0dmFyIHNlbGVjdG9ycyA9IHRoaXMucHJvcHMuZGF0YS5tYXAoZnVuY3Rpb24odGFiKSB7XG5cdFx0XHRyZXR1cm4gKFxuXHRcdFx0XHQ8RGVwbG95VGFiU2VsZWN0IGtleT17dGFiLmlkfSB0YWI9e3RhYn0gb25TZWxlY3Q9e3NlbGYucHJvcHMub25TZWxlY3R9IHNlbGVjdGVkVGFiPXtzZWxmLnByb3BzLnNlbGVjdGVkVGFifSAvPlxuXHRcdFx0KTtcblx0XHR9KTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PHVsIGNsYXNzTmFtZT1cIlNlbGVjdGlvbkdyb3VwIHRhYmJlZHNlbGVjdGlvbmdyb3VwIG5vbGFiZWxcIj5cblx0XHRcdFx0e3NlbGVjdG9yc31cblx0XHRcdDwvdWw+XG5cdFx0KTtcblx0fVxufSk7XG5cbi8qKlxuICogRGVwbG95VGFiU2VsZWN0XG4gKi9cbnZhciBEZXBsb3lUYWJTZWxlY3QgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdGhhbmRsZUNsaWNrOiBmdW5jdGlvbihlKSB7XG5cdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdHRoaXMucHJvcHMub25TZWxlY3QodGhpcy5wcm9wcy50YWIuaWQpXG5cdH0sXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBjbGFzc2VzID0gSGVscGVycy5jbGFzc05hbWVzKHtcblx0XHRcdFwiYWN0aXZlXCIgOiAodGhpcy5wcm9wcy5zZWxlY3RlZFRhYiA9PSB0aGlzLnByb3BzLnRhYi5pZClcblx0XHR9KTtcblx0XHRyZXR1cm4gKFxuXHRcdFx0PGxpIGNsYXNzTmFtZT17Y2xhc3Nlc30+XG5cdFx0XHRcdDxhIG9uQ2xpY2s9e3RoaXMuaGFuZGxlQ2xpY2t9IGhyZWY9e1wiI2RlcGxveS10YWItXCIrdGhpcy5wcm9wcy50YWIuaWR9ID57dGhpcy5wcm9wcy50YWIubmFtZX08L2E+XG5cdFx0XHQ8L2xpPlxuXHRcdCk7XG5cdH1cblxufSk7XG5cbi8qKlxuICogRGVwbG95VGFic1xuICovXG52YXIgRGVwbG95VGFicyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHNlbGYgPSB0aGlzO1xuXHRcdHZhciB0YWJzID0gdGhpcy5wcm9wcy5kYXRhLm1hcChmdW5jdGlvbih0YWIpIHtcblx0XHRcdHJldHVybiAoXG5cdFx0XHRcdDxEZXBsb3lUYWIgY29udGV4dD17c2VsZi5wcm9wcy5jb250ZXh0fSBrZXk9e3RhYi5pZH0gdGFiPXt0YWJ9IHNlbGVjdGVkVGFiPXtzZWxmLnByb3BzLnNlbGVjdGVkVGFifSBTZWN1cml0eVRva2VuPXtzZWxmLnByb3BzLlNlY3VyaXR5VG9rZW59IC8+XG5cdFx0XHQpO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwidGFiLWNvbnRlbnRcIj5cblx0XHRcdFx0e3RhYnN9XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxuLyoqXG4gKiBEZXBsb3lUYWJcbiAqL1xudmFyIERlcGxveVRhYiA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Z2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0c3VtbWFyeTogdGhpcy5nZXRJbml0aWFsU3VtbWFyeVN0YXRlKCksXG5cdFx0XHRvcHRpb25zOiB7fSxcblx0XHRcdHNoYTogJydcblx0XHR9O1xuXHR9LFxuXHRnZXRJbml0aWFsU3VtbWFyeVN0YXRlOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Y2hhbmdlczoge30sXG5cdFx0XHRtZXNzYWdlczogW10sXG5cdFx0XHR2YWxpZGF0aW9uQ29kZTogJycsXG5cdFx0XHRlc3RpbWF0ZWRUaW1lOiBudWxsLFxuXHRcdFx0YWN0aW9uQ29kZTogbnVsbCxcblx0XHRcdGluaXRpYWxTdGF0ZTogdHJ1ZVxuXHRcdH1cblx0fSxcblx0T3B0aW9uQ2hhbmdlSGFuZGxlcjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgb3B0aW9ucyA9IHRoaXMuc3RhdGUub3B0aW9ucztcblx0XHRvcHRpb25zW2V2ZW50LnRhcmdldC5uYW1lXSA9IGV2ZW50LnRhcmdldC5jaGVja2VkO1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0b3B0aW9uczogb3B0aW9uc1xuXHRcdH0pO1xuXHR9LFxuXHRTSEFDaGFuZ2VIYW5kbGVyOiBmdW5jdGlvbihldmVudCkge1xuXHRcdHRoaXMuc2V0U3RhdGUoe1xuXHRcdFx0c2hhOiBldmVudC50YXJnZXQudmFsdWVcblx0XHR9KTtcblx0fSxcblx0Y2hhbmdlSGFuZGxlcjogZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRzdW1tYXJ5OiB0aGlzLmdldEluaXRpYWxTdW1tYXJ5U3RhdGUoKVxuXHRcdH0pO1xuXG5cdFx0aWYoZXZlbnQudGFyZ2V0LnZhbHVlID09PSBcIlwiKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0RXZlbnRzLnB1Ymxpc2goJ2NoYW5nZV9sb2FkaW5nJyk7XG5cblx0XHR2YXIgc3VtbWFyeURhdGEgPSB7XG5cdFx0XHRzaGE6IFJlYWN0LmZpbmRET01Ob2RlKHRoaXMucmVmcy5zaGFfc2VsZWN0b3IucmVmcy5zaGEpLnZhbHVlLFxuXHRcdFx0U2VjdXJpdHlJRDogdGhpcy5wcm9wcy5TZWN1cml0eVRva2VuXG5cdFx0fTtcblx0XHQvLyBtZXJnZSB0aGUgJ2FkdmFuY2VkJyBvcHRpb25zIGlmIHRoZXkgYXJlIHNldFxuXHRcdGZvciAodmFyIGF0dHJuYW1lIGluIHRoaXMuc3RhdGUub3B0aW9ucykge1xuXHRcdFx0aWYodGhpcy5zdGF0ZS5vcHRpb25zLmhhc093blByb3BlcnR5KGF0dHJuYW1lKSkge1xuXHRcdFx0XHRzdW1tYXJ5RGF0YVthdHRybmFtZV0gPSB0aGlzLnN0YXRlLm9wdGlvbnNbYXR0cm5hbWVdO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRRKCQuYWpheCh7XG5cdFx0XHR0eXBlOiBcIlBPU1RcIixcblx0XHRcdGRhdGFUeXBlOiAnanNvbicsXG5cdFx0XHR1cmw6IHRoaXMucHJvcHMuY29udGV4dC5lbnZVcmwgKyAnL2RlcGxveV9zdW1tYXJ5Jyxcblx0XHRcdGRhdGE6IHN1bW1hcnlEYXRhXG5cdFx0fSkpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0dGhpcy5zZXRTdGF0ZSh7XG5cdFx0XHRcdHN1bW1hcnk6IGRhdGFcblx0XHRcdH0pO1xuXHRcdFx0RXZlbnRzLnB1Ymxpc2goJ2NoYW5nZV9sb2FkaW5nL2RvbmUnKTtcblx0XHR9LmJpbmQodGhpcyksIGZ1bmN0aW9uKCl7XG5cdFx0XHRFdmVudHMucHVibGlzaCgnY2hhbmdlX2xvYWRpbmcvZG9uZScpO1xuXHRcdH0pO1xuXHR9LFxuXG5cdHNob3dPcHRpb25zOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5wcm9wcy50YWIuYWR2YW5jZWRfb3B0cyA9PT0gJ3RydWUnO1xuXHR9LFxuXG5cdHNob3dWZXJpZnlCdXR0b246IGZ1bmN0aW9uKCkge1xuXHRcdGlmKHRoaXMuc2hvd09wdGlvbnMoKSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXHRcdHJldHVybiB0aGlzLnByb3BzLnRhYi5maWVsZF90eXBlID09ICd0ZXh0ZmllbGQnO1xuXHR9LFxuXG5cdHNoYUNob3NlbjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICh0aGlzLnN0YXRlLnNoYSAhPT0gJycpO1xuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBjbGFzc2VzID0gSGVscGVycy5jbGFzc05hbWVzKHtcblx0XHRcdFwidGFiLXBhbmVcIjogdHJ1ZSxcblx0XHRcdFwiY2xlYXJmaXhcIjogdHJ1ZSxcblx0XHRcdFwiYWN0aXZlXCIgOiAodGhpcy5wcm9wcy5zZWxlY3RlZFRhYiA9PSB0aGlzLnByb3BzLnRhYi5pZClcblx0XHR9KTtcblxuXHRcdC8vIHNldHVwIHRoZSBkcm9wZG93biBvciB0aGUgdGV4dCBpbnB1dCBmb3Igc2VsZWN0aW5nIGEgU0hBXG5cdFx0dmFyIHNlbGVjdG9yO1xuXHRcdGlmICh0aGlzLnByb3BzLnRhYi5maWVsZF90eXBlID09ICdkcm9wZG93bicpIHtcblx0XHRcdHZhciBjaGFuZ2VIYW5kbGVyID0gdGhpcy5jaGFuZ2VIYW5kbGVyO1xuXHRcdFx0aWYodGhpcy5zaG93VmVyaWZ5QnV0dG9uKCkpIHsgY2hhbmdlSGFuZGxlciA9IHRoaXMuU0hBQ2hhbmdlSGFuZGxlciB9XG5cdFx0XHRzZWxlY3RvciA9IDxTZWxlY3RvckRyb3Bkb3duIHJlZj1cInNoYV9zZWxlY3RvclwiIHRhYj17dGhpcy5wcm9wcy50YWJ9IGNoYW5nZUhhbmRsZXI9e2NoYW5nZUhhbmRsZXJ9IC8+XG5cdFx0fSBlbHNlIGlmICh0aGlzLnByb3BzLnRhYi5maWVsZF90eXBlID09ICd0ZXh0ZmllbGQnKSB7XG5cdFx0XHRzZWxlY3RvciA9IDxTZWxlY3RvclRleHQgcmVmPVwic2hhX3NlbGVjdG9yXCIgdGFiPXt0aGlzLnByb3BzLnRhYn0gY2hhbmdlSGFuZGxlcj17dGhpcy5TSEFDaGFuZ2VIYW5kbGVyfSAvPlxuXHRcdH1cblxuXHRcdC8vICdBZHZhbmNlZCcgb3B0aW9uc1xuXHRcdHZhciBvcHRpb25zID0gbnVsbDtcblx0XHRpZih0aGlzLnNob3dPcHRpb25zKCkpIHtcblx0XHRcdG9wdGlvbnMgPSA8QWR2YW5jZWRPcHRpb25zIHRhYj17dGhpcy5wcm9wcy50YWJ9IGNoYW5nZUhhbmRsZXI9e3RoaXMuT3B0aW9uQ2hhbmdlSGFuZGxlcn0gLz5cblx0XHR9XG5cblx0XHQvLyAnVGhlIHZlcmlmeSBidXR0b24nXG5cdFx0dmFyIHZlcmlmeUJ1dHRvbiA9IG51bGw7XG5cdFx0aWYodGhpcy5zaG93VmVyaWZ5QnV0dG9uKCkpIHtcblx0XHRcdHZlcmlmeUJ1dHRvbiA9IDxWZXJpZnlCdXR0b24gZGlzYWJsZWQ9eyF0aGlzLnNoYUNob3NlbigpfSBjaGFuZ2VIYW5kbGVyPXt0aGlzLmNoYW5nZUhhbmRsZXJ9IC8+XG5cdFx0fVxuXG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgaWQ9e1wiZGVwbG95LXRhYi1cIit0aGlzLnByb3BzLnRhYi5pZH0gY2xhc3NOYW1lPXtjbGFzc2VzfT5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJzZWN0aW9uXCI+XG5cdFx0XHRcdFx0PGRpdiBodG1sRm9yPXt0aGlzLnByb3BzLnRhYi5maWVsZF9pZH0gY2xhc3NOYW1lPVwiaGVhZGVyXCI+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzc05hbWU9XCJudW1iZXJDaXJjbGVcIj4xPC9zcGFuPiB7dGhpcy5wcm9wcy50YWIuZmllbGRfbGFiZWx9XG5cdFx0XHRcdFx0PC9kaXY+XG5cdFx0XHRcdFx0e3NlbGVjdG9yfVxuXHRcdFx0XHRcdHtvcHRpb25zfVxuXHRcdFx0XHRcdHt2ZXJpZnlCdXR0b259XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0XHQ8RGVwbG95UGxhbiBjb250ZXh0PXt0aGlzLnByb3BzLmNvbnRleHR9IHN1bW1hcnk9e3RoaXMuc3RhdGUuc3VtbWFyeX0gLz5cblx0XHRcdDwvZGl2PlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgU2VsZWN0b3JEcm9wZG93biA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0Y29tcG9uZW50RGlkTW91bnQ6IGZ1bmN0aW9uKCkge1xuXHRcdCQoUmVhY3QuZmluZERPTU5vZGUodGhpcy5yZWZzLnNoYSkpLnNlbGVjdDIoe1xuXHRcdFx0Ly8gTG9hZCBkYXRhIGludG8gdGhlIHNlbGVjdDIuXG5cdFx0XHQvLyBUaGUgZm9ybWF0IHN1cHBvcnRzIG9wdGdyb3VwcywgYW5kIGxvb2tzIGxpa2UgdGhpczpcblx0XHRcdC8vIFt7dGV4dDogJ29wdGdyb3VwIHRleHQnLCBjaGlsZHJlbjogW3tpZDogJzxzaGE+JywgdGV4dDogJzxpbm5lciB0ZXh0Pid9XX1dXG5cdFx0XHRkYXRhOiB0aGlzLnByb3BzLnRhYi5maWVsZF9kYXRhXG5cdFx0fSk7XG5cblx0XHQvLyBUcmlnZ2VyIGhhbmRsZXIgb25seSBuZWVkZWQgaWYgdGhlcmUgaXMgbm8gZXhwbGljaXQgYnV0dG9uLlxuXHRcdGlmKHRoaXMucHJvcHMuY2hhbmdlSGFuZGxlcikge1xuXHRcdFx0JChSZWFjdC5maW5kRE9NTm9kZSh0aGlzLnJlZnMuc2hhKSkuc2VsZWN0MigpLm9uKFwiY2hhbmdlXCIsIHRoaXMucHJvcHMuY2hhbmdlSGFuZGxlcik7XG5cdFx0fVxuXHR9LFxuXG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0Ly8gRnJvbSBodHRwczovL3NlbGVjdDIuZ2l0aHViLmlvL2V4YW1wbGVzLmh0bWwgXCJUaGUgYmVzdCB3YXkgdG8gZW5zdXJlIHRoYXQgU2VsZWN0MiBpcyB1c2luZyBhIHBlcmNlbnQgYmFzZWRcblx0XHQvLyB3aWR0aCBpcyB0byBpbmxpbmUgdGhlIHN0eWxlIGRlY2xhcmF0aW9uIGludG8gdGhlIHRhZ1wiLlxuXHRcdHZhciBzdHlsZSA9IHt3aWR0aDogJzEwMCUnfTtcblxuXHRcdHJldHVybiAoXG5cdFx0XHQ8ZGl2PlxuXHRcdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZpZWxkXCI+XG5cdFx0XHRcdFx0PHNlbGVjdFxuXHRcdFx0XHRcdFx0cmVmPVwic2hhXCJcblx0XHRcdFx0XHRcdGlkPXt0aGlzLnByb3BzLnRhYi5maWVsZF9pZH1cblx0XHRcdFx0XHRcdG5hbWU9XCJzaGFcIlxuXHRcdFx0XHRcdFx0Y2xhc3NOYW1lPVwiZHJvcGRvd25cIlxuXHRcdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMucHJvcHMuY2hhbmdlSGFuZGxlcn1cblx0XHRcdFx0XHRcdHN0eWxlPXtzdHlsZX0+XG5cdFx0XHRcdFx0XHQ8b3B0aW9uIHZhbHVlPVwiXCI+U2VsZWN0IHt0aGlzLnByb3BzLnRhYi5maWVsZF9pZH08L29wdGlvbj5cblx0XHRcdFx0XHQ8L3NlbGVjdD5cblx0XHRcdFx0PC9kaXY+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIFNlbGVjdG9yVGV4dCA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4oXG5cdFx0XHQ8ZGl2IGNsYXNzTmFtZT1cImZpZWxkXCI+XG5cdFx0XHRcdDxpbnB1dFxuXHRcdFx0XHRcdHR5cGU9XCJ0ZXh0XCJcblx0XHRcdFx0XHRyZWY9XCJzaGFcIlxuXHRcdFx0XHRcdGlkPXt0aGlzLnByb3BzLnRhYi5maWVsZF9pZH1cblx0XHRcdFx0XHRuYW1lPVwic2hhXCJcblx0XHRcdFx0XHRjbGFzc05hbWU9XCJ0ZXh0XCJcblx0XHRcdFx0XHRvbkNoYW5nZT17dGhpcy5wcm9wcy5jaGFuZ2VIYW5kbGVyfVxuXHRcdFx0XHQvPlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbnZhciBWZXJpZnlCdXR0b24gPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiXCI+XG5cdFx0XHRcdDxidXR0b25cblx0XHRcdFx0XHRkaXNhYmxlZD17dGhpcy5wcm9wcy5kaXNhYmxlZH1cblx0XHRcdFx0XHR2YWx1ZT1cIlZlcmlmeSBkZXBsb3ltZW50XCJcblx0XHRcdFx0XHRjbGFzc05hbWU9XCJidG4gYnRuLWRlZmF1bHRcIlxuXHRcdFx0XHRcdG9uQ2xpY2s9e3RoaXMucHJvcHMuY2hhbmdlSGFuZGxlcn0+XG5cdFx0XHRcdFx0VmVyaWZ5IGRlcGxveW1lbnRcblx0XHRcdFx0PC9idXR0b24+XG5cdFx0XHQ8L2Rpdj5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIEFkdmFuY2VkT3B0aW9ucyA9IFJlYWN0LmNyZWF0ZUNsYXNzKHtcblx0cmVuZGVyOiBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDxkaXYgY2xhc3NOYW1lPVwiZGVwbG95LW9wdGlvbnNcIj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmaWVsZGNoZWNrYm94XCI+XG5cdFx0XHRcdFx0PGxhYmVsPlxuXHRcdFx0XHRcdFx0PGlucHV0XG5cdFx0XHRcdFx0XHRcdHR5cGU9XCJjaGVja2JveFwiXG5cdFx0XHRcdFx0XHRcdG5hbWU9XCJmb3JjZV9mdWxsXCJcblx0XHRcdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMucHJvcHMuY2hhbmdlSGFuZGxlcn1cblx0XHRcdFx0XHRcdC8+XG5cdFx0XHRcdFx0XHRGb3JjZSBmdWxsIGRlcGxveW1lbnRcblx0XHRcdFx0XHQ8L2xhYmVsPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFx0PGRpdiBjbGFzc05hbWU9XCJmaWVsZGNoZWNrYm94XCI+XG5cdFx0XHRcdFx0PGxhYmVsPlxuXHRcdFx0XHRcdFx0PGlucHV0XG5cdFx0XHRcdFx0XHRcdHR5cGU9XCJjaGVja2JveFwiXG5cdFx0XHRcdFx0XHRcdG5hbWU9XCJmb3JjZV9ub3JvbGxiYWNrXCJcblx0XHRcdFx0XHRcdFx0b25DaGFuZ2U9e3RoaXMucHJvcHMuY2hhbmdlSGFuZGxlcn1cblx0XHRcdFx0XHRcdC8+XG5cdFx0XHRcdFx0XHRGb3JjZSBubyByb2xsYmFja1xuXHRcdFx0XHRcdDwvbGFiZWw+XG5cdFx0XHRcdDwvZGl2PlxuXHRcdFx0PC9kaXY+XG5cdFx0KTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRGVwbG95bWVudERpYWxvZztcbiIsIi8qKlxuICogQSBzaW1wbGUgcHViIHN1YiBldmVudCBoYW5kbGVyIGZvciBpbnRlcmNvbXBvbmVudCBjb21tdW5pY2F0aW9uXG4gKi9cbnZhciB0b3BpY3MgPSB7fTtcbnZhciBoT1AgPSB0b3BpY3MuaGFzT3duUHJvcGVydHk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuXHRzdWJzY3JpYmU6IGZ1bmN0aW9uKHRvcGljLCBsaXN0ZW5lcikge1xuXHRcdC8vIENyZWF0ZSB0aGUgdG9waWMncyBvYmplY3QgaWYgbm90IHlldCBjcmVhdGVkXG5cdFx0aWYoIWhPUC5jYWxsKHRvcGljcywgdG9waWMpKSB0b3BpY3NbdG9waWNdID0gW107XG5cblx0XHQvLyBBZGQgdGhlIGxpc3RlbmVyIHRvIHF1ZXVlXG5cdFx0dmFyIGluZGV4ID0gdG9waWNzW3RvcGljXS5wdXNoKGxpc3RlbmVyKSAtMTtcblxuXHRcdC8vIFByb3ZpZGUgaGFuZGxlIGJhY2sgZm9yIHJlbW92YWwgb2YgdG9waWNcblx0XHRyZXR1cm4ge1xuXHRcdFx0cmVtb3ZlOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0ZGVsZXRlIHRvcGljc1t0b3BpY11baW5kZXhdO1xuXHRcdFx0fVxuXHRcdH07XG5cdH0sXG5cblx0cHVibGlzaDogZnVuY3Rpb24odG9waWMsIGluZm8pIHtcblx0XHQvLyBJZiB0aGUgdG9waWMgZG9lc24ndCBleGlzdCwgb3IgdGhlcmUncyBubyBsaXN0ZW5lcnMgaW4gcXVldWUsIGp1c3QgbGVhdmVcblx0XHRpZighaE9QLmNhbGwodG9waWNzLCB0b3BpYykpIHJldHVybjtcblxuXHRcdC8vIEN5Y2xlIHRocm91Z2ggdG9waWNzIHF1ZXVlLCBmaXJlIVxuXHRcdHRvcGljc1t0b3BpY10uZm9yRWFjaChmdW5jdGlvbihpdGVtKSB7XG5cdFx0XHRpdGVtKGluZm8gIT0gdW5kZWZpbmVkID8gaW5mbyA6IHt9KTtcblx0XHR9KTtcblx0fVxufTtcbiIsIi8qKlxuICogSGVscGVyIGNsYXNzIHRvIGNvbmNhdGluYXRlIHN0cmluZ3MgZGVwZWRpbmcgb24gYSB0cnVlIG9yIGZhbHNlLlxuICpcbiAqIEV4YW1wbGU6XG4gKiB2YXIgY2xhc3NlcyA9IEhlbHBlcnMuY2xhc3NOYW1lcyh7XG4gKiAgICAgXCJkZXBsb3ktZHJvcGRvd25cIjogdHJ1ZSxcbiAqICAgICBcImxvYWRpbmdcIjogZmFsc2UsXG4gKiAgICAgXCJvcGVuXCI6IHRydWUsXG4gKiB9KTtcbiAqXG4gKiB0aGVuIGNsYXNzZXMgd2lsbCBlcXVhbCBcImRlcGxveS1kcm9wZG93biBvcGVuXCJcbiAqXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0Y2xhc3NOYW1lczogZnVuY3Rpb24gKCkge1xuXHRcdHZhciBjbGFzc2VzID0gJyc7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBhcmcgPSBhcmd1bWVudHNbaV07XG5cdFx0XHRpZiAoIWFyZykgY29udGludWU7XG5cblx0XHRcdHZhciBhcmdUeXBlID0gdHlwZW9mIGFyZztcblxuXHRcdFx0aWYgKCdzdHJpbmcnID09PSBhcmdUeXBlIHx8ICdudW1iZXInID09PSBhcmdUeXBlKSB7XG5cdFx0XHRcdGNsYXNzZXMgKz0gJyAnICsgYXJnO1xuXG5cdFx0XHR9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoYXJnKSkge1xuXHRcdFx0XHRjbGFzc2VzICs9ICcgJyArIGNsYXNzTmFtZXMuYXBwbHkobnVsbCwgYXJnKTtcblxuXHRcdFx0fSBlbHNlIGlmICgnb2JqZWN0JyA9PT0gYXJnVHlwZSkge1xuXHRcdFx0XHRmb3IgKHZhciBrZXkgaW4gYXJnKSB7XG5cdFx0XHRcdFx0aWYgKGFyZy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmIGFyZ1trZXldKSB7XG5cdFx0XHRcdFx0XHRjbGFzc2VzICs9ICcgJyArIGtleTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGNsYXNzZXMuc3Vic3RyKDEpO1xuXHR9XG59XG4iLCJ2YXIgRGVwbG95bWVudERpYWxvZyA9IHJlcXVpcmUoJy4vZGVwbG95bWVudF9kaWFsb2cuanN4Jyk7XG5cbi8vIE1vdW50IHRoZSBjb21wb25lbnQgb25seSBvbiB0aGUgcGFnZSB3aGVyZSB0aGUgaG9sZGVyIGlzIGFjdHVhbGx5IHByZXNlbnQuXG52YXIgaG9sZGVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RlcGxveW1lbnQtZGlhbG9nLWhvbGRlcicpO1xuaWYgKGhvbGRlcikge1xuXHRSZWFjdC5yZW5kZXIoXG5cdFx0PERlcGxveW1lbnREaWFsb2cgY29udGV4dCA9IHtlbnZpcm9ubWVudENvbmZpZ0NvbnRleHR9IC8+LFxuXHRcdGhvbGRlclxuXHQpO1xufVxuXG5cbiIsIlxuLyoqXG4gKiBAanN4IFJlYWN0LkRPTVxuICovXG52YXIgU3VtbWFyeVRhYmxlID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRpc0VtcHR5OiBmdW5jdGlvbihvYmopIHtcblx0XHRmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG5cdFx0XHRpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkgJiYgb2JqW2tleV0pIHtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblx0cmVuZGVyOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgY2hhbmdlcyA9IHRoaXMucHJvcHMuY2hhbmdlcztcblx0XHRpZih0aGlzLmlzRW1wdHkoY2hhbmdlcykpIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblx0XHR2YXIgaWR4ID0gMDtcblx0XHR2YXIgc3VtbWFyeUxpbmVzID0gT2JqZWN0LmtleXMoY2hhbmdlcykubWFwKGZ1bmN0aW9uKGtleSkge1xuXHRcdFx0aWR4Kys7XG5cblx0XHRcdHZhciBjb21wYXJlVXJsID0gbnVsbDtcblx0XHRcdGlmKHR5cGVvZiBjaGFuZ2VzW2tleV0uY29tcGFyZVVybCAhPSAndW5kZWZpbmVkJykge1xuXHRcdFx0XHRjb21wYXJlVXJsID0gY2hhbmdlc1trZXldLmNvbXBhcmVVcmw7XG5cdFx0XHR9XG5cblx0XHRcdGlmKHR5cGVvZiBjaGFuZ2VzW2tleV0uZGVzY3JpcHRpb24hPT0ndW5kZWZpbmVkJykge1xuXG5cdFx0XHRcdGlmIChjaGFuZ2VzW2tleV0uZGVzY3JpcHRpb24hPT1cIlwiKSB7XG5cdFx0XHRcdFx0cmV0dXJuIDxEZXNjcmlwdGlvbk9ubHlTdW1tYXJ5TGluZSBrZXk9e2lkeH0gbmFtZT17a2V5fSBkZXNjcmlwdGlvbj17Y2hhbmdlc1trZXldLmRlc2NyaXB0aW9ufSAvPlxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJldHVybiA8VW5jaGFuZ2VkU3VtbWFyeUxpbmUga2V5PXtpZHh9IG5hbWU9e2tleX0gdmFsdWU9XCJcIiAvPlxuXHRcdFx0XHR9XG5cblx0XHRcdH0gZWxzZSBpZihjaGFuZ2VzW2tleV0uZnJvbSAhPSBjaGFuZ2VzW2tleV0udG8pIHtcblx0XHRcdFx0cmV0dXJuIDxTdW1tYXJ5TGluZSBrZXk9e2lkeH0gbmFtZT17a2V5fSBmcm9tPXtjaGFuZ2VzW2tleV0uZnJvbX0gdG89e2NoYW5nZXNba2V5XS50b30gY29tcGFyZVVybD17Y29tcGFyZVVybH0gLz5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiA8VW5jaGFuZ2VkU3VtbWFyeUxpbmUga2V5PXtpZHh9IG5hbWU9e2tleX0gdmFsdWU9e2NoYW5nZXNba2V5XS5mcm9tfSAvPlxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIChcblx0XHRcdDx0YWJsZSBjbGFzc05hbWU9XCJ0YWJsZSB0YWJsZS1zdHJpcGVkIHRhYmxlLWhvdmVyXCI+XG5cdFx0XHRcdDx0Ym9keT5cblx0XHRcdFx0XHR7c3VtbWFyeUxpbmVzfVxuXHRcdFx0XHQ8L3Rib2R5PlxuXHRcdFx0PC90YWJsZT5cblx0XHQpO1xuXHR9XG59KTtcblxudmFyIFN1bW1hcnlMaW5lID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBmcm9tID0gdGhpcy5wcm9wcy5mcm9tLFxuXHRcdFx0dG8gPSB0aGlzLnByb3BzLnRvO1xuXG5cdFx0Ly8gbmFpdmUgZ2l0IHNoYSBkZXRlY3Rpb25cblx0XHRpZihmcm9tICE9PSBudWxsICYmIGZyb20ubGVuZ3RoID09PSA0MCkge1xuXHRcdFx0ZnJvbSA9IGZyb20uc3Vic3RyaW5nKDAsNyk7XG5cdFx0fVxuXG5cdFx0Ly8gbmFpdmUgZ2l0IHNoYSBkZXRlY3Rpb25cblx0XHRpZih0byAhPT0gbnVsbCAmJiB0by5sZW5ndGggPT09IDQwKSB7XG5cdFx0XHR0byA9IHRvLnN1YnN0cmluZygwLDcpO1xuXHRcdH1cblxuXHRcdHZhciBjb21wYXJlVXJsID0gbnVsbDtcblx0XHRpZih0aGlzLnByb3BzLmNvbXBhcmVVcmwgIT09IG51bGwpIHtcblx0XHRcdGNvbXBhcmVVcmwgPSA8YSB0YXJnZXQ9XCJfYmxhbmtcIiBocmVmPXt0aGlzLnByb3BzLmNvbXBhcmVVcmx9PlZpZXcgZGlmZjwvYT5cblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PHRyPlxuXHRcdFx0XHQ8dGggc2NvcGU9XCJyb3dcIj57dGhpcy5wcm9wcy5uYW1lfTwvdGg+XG5cdFx0XHRcdDx0ZD57ZnJvbX08L3RkPlxuXHRcdFx0XHQ8dGQ+PHNwYW4gY2xhc3NOYW1lPVwiZ2x5cGhpY29uIGdseXBoaWNvbi1hcnJvdy1yaWdodFwiIC8+PC90ZD5cblx0XHRcdFx0PHRkPnt0b308L3RkPlxuXHRcdFx0XHQ8dGQgY2xhc3NOYW1lPVwiY2hhbmdlQWN0aW9uXCI+e2NvbXBhcmVVcmx9PC90ZD5cblx0XHRcdDwvdHI+XG5cdFx0KVxuXHR9XG59KTtcblxudmFyIFVuY2hhbmdlZFN1bW1hcnlMaW5lID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXHRyZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBmcm9tID0gdGhpcy5wcm9wcy52YWx1ZTtcblx0XHQvLyBuYWl2ZSBnaXQgc2hhIGRldGVjdGlvblxuXHRcdGlmKGZyb20gIT09IG51bGwgJiYgZnJvbS5sZW5ndGggPT09IDQwKSB7XG5cdFx0XHRmcm9tID0gZnJvbS5zdWJzdHJpbmcoMCw3KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gKFxuXHRcdFx0PHRyPlxuXHRcdFx0XHQ8dGggc2NvcGU9XCJyb3dcIj57dGhpcy5wcm9wcy5uYW1lfTwvdGg+XG5cdFx0XHRcdDx0ZD57ZnJvbX08L3RkPlxuXHRcdFx0XHQ8dGQ+Jm5ic3A7PC90ZD5cblx0XHRcdFx0PHRkPjxzcGFuIGNsYXNzTmFtZT1cImxhYmVsIGxhYmVsLXN1Y2Nlc3NcIj5VbmNoYW5nZWQ8L3NwYW4+PC90ZD5cblx0XHRcdFx0PHRkPiZuYnNwOzwvdGQ+XG5cdFx0XHQ8L3RyPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG52YXIgRGVzY3JpcHRpb25Pbmx5U3VtbWFyeUxpbmUgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cdHJlbmRlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdDx0cj5cblx0XHRcdFx0PHRoIHNjb3BlPVwicm93XCI+e3RoaXMucHJvcHMubmFtZX08L3RoPlxuXHRcdFx0XHQ8dGQgY29sU3Bhbj1cIjRcIiBkYW5nZXJvdXNseVNldElubmVySFRNTD17e19faHRtbDogdGhpcy5wcm9wcy5kZXNjcmlwdGlvbn19IC8+XG5cdFx0XHQ8L3RyPlxuXHRcdCk7XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN1bW1hcnlUYWJsZTtcbiJdfQ==
