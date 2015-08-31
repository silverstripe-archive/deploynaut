/**
 * Helper class to concatinate strings depeding on a true or false.
 *
 * Example:
 * var classes = classNames({
 *     "deploy-dropdown": true,
 *     "loading": false,
 *     "open": true,
 * });
 *
 * then classes will equal "deploy-dropdown open"
 *
 * @returns {string}
 */
'use strict';

function classNames() {

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

var events = (function () {
	var topics = {};
	var hOP = topics.hasOwnProperty;

	return {
		subscribe: function subscribe(topic, listener) {
			// Create the topic's object if not yet created
			if (!hOP.call(topics, topic)) topics[topic] = [];

			// Add the listener to queue
			var index = topics[topic].push(listener) - 1;

			// Provide handle back for removal of topic
			return {
				remove: function remove() {
					delete topics[topic][index];
				}
			};
		},
		publish: function publish(topic, info) {
			// If the topic doesn't exist, or there's no listeners in queue, just leave
			if (!hOP.call(topics, topic)) return;

			// Cycle through topics queue, fire!
			topics[topic].forEach(function (item) {
				item(info != undefined ? info : {});
			});
		}
	};
})();

/**
 * DeployDropdown
 */
var DeployDropDown = React.createClass({
	displayName: 'DeployDropDown',

	loading: null,
	loadingDone: null,

	getInitialState: function getInitialState() {
		return {
			loading: false,
			loaded: false,
			opened: false,
			loadingText: ""
		};
	},
	componentDidMount: function componentDidMount() {
		var self = this;
		this.loading = events.subscribe('loading', function (text) {
			self.setState({
				loading: true,
				opened: false,
				success: false,
				loadingText: text
			});
		});
		this.loadingDone = events.subscribe('loading_done', function () {
			self.setState({
				loading: false,
				loadingText: '',
				success: true,
				opened: true
			});
		});
	},
	componentWillUnmount: function componentWillUnmount() {
		this.loading.remove();
	},
	handleClick: function handleClick(e) {
		e.preventDefault();
		events.publish('loading', "Fetching latest code…");
		var self = this;
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.project_url + '/fetch'
		})).then(this.waitForFetchToComplete, this.fetchStatusError).then(function () {
			events.publish('loading_done');
		})['catch'](function (data) {
			console.error(data);
		}).done();
	},
	waitForFetchToComplete: function waitForFetchToComplete(fetchData) {
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
	getFetchStatus: function getFetchStatus(fetchData) {
		return Q($.ajax({
			type: "GET",
			url: fetchData.href,
			dataType: 'json'
		}));
	},
	fetchStatusError: function fetchStatusError(data) {
		console.error(data);
	},
	render: function render() {
		var classes = classNames({
			"deploy-dropdown": true,
			"loading": this.state.loading,
			"open": this.state.opened,
			"success": this.state.success
		});
		return React.createElement(
			'div',
			null,
			React.createElement(
				'div',
				{ className: classes, onClick: this.handleClick },
				React.createElement('span', { className: 'status-icon', 'aria-hidden': 'true' }),
				React.createElement(
					'span',
					{ className: 'loading-text' },
					this.state.loadingText
				),
				React.createElement(EnvironmentName, { environmentName: '' })
			),
			React.createElement(DeployForm, { data: this.props.data, env_url: this.props.env_url })
		);
	}
});

/**
 * EnvironmentName
 */
var EnvironmentName = React.createClass({
	displayName: 'EnvironmentName',

	render: function render() {
		return React.createElement(
			'span',
			{ className: 'environment-name' },
			React.createElement(
				'i',
				{ className: 'fa fa-rocket' },
				' '
			),
			'Deployment options ',
			React.createElement(
				'span',
				{ className: 'hidden-xs' },
				'for ',
				this.props.environmentName
			)
		);
	}
});

/**
 * DeployForm
 */
var DeployForm = React.createClass({
	displayName: 'DeployForm',

	getInitialState: function getInitialState() {
		return {
			selectedTab: 1,
			data: []
		};
	},
	componentDidMount: function componentDidMount() {
		this.gitData();
	},

	gitData: function gitData() {
		var self = this;
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.env_url + '/git_revisions'
		})).then(function (data) {
			self.setState({
				data: data
			});
		}, function (data) {
			console.error(data);
		});
	},

	selectHandler: function selectHandler(id) {
		this.setState({ selectedTab: id });
	},
	render: function render() {
		return React.createElement(
			'div',
			{ className: 'deploy-form-outer clearfix collapse in' },
			React.createElement(
				'form',
				{ className: 'form-inline deploy-form', action: 'POST', action: '#' },
				React.createElement(DeployTabSelector, { data: this.state.data, onSelect: this.selectHandler, selectedTab: this.state.selectedTab }),
				React.createElement(DeployTabs, { data: this.state.data, selectedTab: this.state.selectedTab, env_url: this.props.env_url })
			)
		);
	}
});

/**
 * DeployTabSelector
 */
var DeployTabSelector = React.createClass({
	displayName: 'DeployTabSelector',

	render: function render() {
		var self = this;
		var selectors = this.props.data.map(function (tab) {
			return React.createElement(DeployTabSelect, { key: tab.id, tab: tab, onSelect: self.props.onSelect, selectedTab: self.props.selectedTab });
		});
		return React.createElement(
			'ul',
			{ className: 'SelectionGroup tabbedselectiongroup nolabel' },
			selectors
		);
	}
});

/**
 * DeployTabSelect
 */
var DeployTabSelect = React.createClass({
	displayName: 'DeployTabSelect',

	handleClick: function handleClick(e) {
		e.preventDefault();
		this.props.onSelect(this.props.tab.id);
	},
	render: function render() {
		var classes = classNames({
			"active": this.props.selectedTab == this.props.tab.id
		});
		return React.createElement(
			'li',
			{ className: classes },
			React.createElement(
				'a',
				{ onClick: this.handleClick, href: "#deploy-tab-" + this.props.tab.id },
				this.props.tab.name
			)
		);
	}
});

/**
 * DeployTabs
 */
var DeployTabs = React.createClass({
	displayName: 'DeployTabs',

	render: function render() {
		var self = this;
		var tabs = this.props.data.map(function (tab) {
			return React.createElement(DeployTab, { key: tab.id, tab: tab, selectedTab: self.props.selectedTab, env_url: self.props.env_url });
		});

		return React.createElement(
			'div',
			{ className: 'tab-content' },
			tabs
		);
	}
});

/**
 * DeployTab
 */
var DeployTab = React.createClass({
	displayName: 'DeployTab',

	getInitialState: function getInitialState() {
		return {
			summary: {
				changes: null,
				messages: null,
				validationCode: '',
				estimatedTime: null,
				initialState: true
			}
		};
	},
	componentDidMount: function componentDidMount() {
		$(React.findDOMNode(this.refs.sha_selector)).select2().on("change", this.selectChangeHandler);
	},
	selectChangeHandler: function selectChangeHandler(event) {

		this.setState(this.getInitialState());
		if (event.target.value === "") {
			return;
		}
		events.publish('loading', "Calculating changes…");
		var self = this;
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.env_url + '/deploy_summary',
			data: { 'sha': event.target.value }
		})).then(function (data) {
			self.setState({
				summary: data
			});
			events.publish('loading_done');
		}, function (data) {
			console.error(data);
		});
	},

	render: function render() {
		var classes = classNames({
			"tab-pane": true,
			"clearfix": true,
			"active": this.props.selectedTab == this.props.tab.id
		});
		var id = 0;
		var options = this.props.tab.field_data.map(function (data) {
			id++;
			return React.createElement(
				'option',
				{ key: id, value: data.value },
				data.name
			);
		});
		return React.createElement(
			'div',
			{ id: "deploy-tab-" + this.props.tab.id, className: classes },
			React.createElement(
				'div',
				{ className: 'section' },
				React.createElement(
					'label',
					{ htmlFor: this.props.tab.field_id },
					React.createElement(
						'span',
						{ className: 'numberCircle' },
						'1'
					),
					' ',
					this.props.tab.field_label
				),
				React.createElement(
					'div',
					{ className: 'field' },
					React.createElement(
						'select',
						{ ref: 'sha_selector', id: this.props.tab.field_id, name: 'sha', className: 'dropdown', onChange: this.selectChangeHandler },
						React.createElement(
							'option',
							{ value: '' },
							'Select ',
							this.props.tab.field_id
						),
						options
					)
				)
			),
			React.createElement(DeployPlan, { summary: this.state.summary, env_url: this.props.env_url })
		);
	}
});

/**
 * DeployPlan
 */
var DeployPlan = React.createClass({
	displayName: 'DeployPlan',

	submitHandler: function submitHandler(event) {
		event.preventDefault();
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.env_url + '/start-deploy',
			data: this.props.summary
		})).then(function (data) {
			window.location = data.url;
		}, function (data) {
			console.error(data);
		});
	},
	render: function render() {
		var messages = this.props.summary.messages;
		var canDeploy = this.props.summary.validationCode === "success" || this.props.summary.validationCode === "warning";

		var messageList = [];
		if (messages) {
			messageList = messages.map(function (message) {
				return React.createElement(
					'div',
					{ className: message.code == 'error' ? 'alert alert-danger' : 'alert alert-warning', role: 'alert' },
					message.text
				);
			});
		}

		if (this.props.summary.changes) {
			var changeBlock = React.createElement(SummaryTable, { changes: this.props.summary.changes });
		} else if (!this.props.summary.initialState && messageList.length === 0) {
			var changeBlock = React.createElement(
				'div',
				{ className: 'alert alert-info', role: 'alert' },
				'There are no changes but you can deploy anyway if you wish.'
			);
		}

		return React.createElement(
			'div',
			null,
			React.createElement(
				'div',
				{ className: 'section' },
				React.createElement(
					'label',
					null,
					React.createElement(
						'span',
						{ className: 'numberCircle' },
						'2'
					),
					' Review changes'
				),
				messageList,
				changeBlock
			),
			React.createElement(
				'div',
				{ className: 'section' },
				React.createElement(
					'button',
					{
						value: 'Confirm Deployment',
						className: 'action btn btn-primary deploy-button',
						disabled: !canDeploy,
						onClick: this.submitHandler },
					this.props.summary.actionTitle ? this.props.summary.actionTitle : 'Make a selection',
					React.createElement('br', null),
					React.createElement(EstimatedTime, { estimatedTime: this.props.summary.estimatedTime })
				)
			)
		);
	}
});

/**
 * EstimatedTime
 */
var EstimatedTime = React.createClass({
	displayName: 'EstimatedTime',

	render: function render() {
		var estimatedTime = this.props.estimatedTime;
		if (estimatedTime && estimatedTime > 0) {
			return React.createElement(
				'small',
				null,
				'Approx. ',
				estimatedTime,
				' min'
			);
		}

		return null;
	}
});

/**
 * SummaryTable
 */
var SummaryTable = React.createClass({
	displayName: 'SummaryTable',

	render: function render() {
		var i = 0;
		var changes = this.props.changes;

		var summaryLines = Object.keys(changes).map(function (key) {
			i++;
			return React.createElement(SummaryLine, { key: i, name: key, from: changes[key].from, to: changes[key].to });
		});

		return React.createElement(
			'table',
			{ className: 'table table-striped table-hover' },
			React.createElement(
				'thead',
				null,
				React.createElement(
					'tr',
					null,
					React.createElement('th', null),
					React.createElement(
						'th',
						null,
						'From'
					),
					React.createElement(
						'th',
						null,
						'To'
					)
				)
			),
			React.createElement(
				'tbody',
				null,
				summaryLines
			)
		);
	}
});

/**
 * SummaryLine
 */
var SummaryLine = React.createClass({
	displayName: 'SummaryLine',

	render: function render() {
		var from = this.props.from.substring(0, 30);
		var to = this.props.to.substring(0, 30);
		return React.createElement(
			'tr',
			null,
			React.createElement(
				'th',
				{ scope: 'row' },
				this.props.name
			),
			React.createElement(
				'td',
				null,
				from
			),
			React.createElement(
				'td',
				null,
				to
			)
		);
	}
});

/**
 * Render
 */
React.render(React.createElement(DeployDropDown, { project_url: urls.project_url, env_url: urls.env_url }), document.getElementById('deploy_form'));