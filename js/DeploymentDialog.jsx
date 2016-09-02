/* global Q */

var React = require("react");
var ReactDOM = require("react-dom");

var Events = require('./events.js');
var Helpers = require('./helpers.js');
var DeployPlan = require('./DeployPlan.jsx');

var DeploymentDialog = React.createClass({

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
		this.subscriptions.push(Events.subscribe('loading', function(text) {
			this.setState({
				loading: true,
				success: false,
				loadingText: text
			});
		}.bind(this)));
		this.subscriptions.push(Events.subscribe('loading/done', function() {
			this.setState({
				loading: false,
				loadingText: '',
				success: true
			});
		}.bind(this)));
		this.subscriptions.push(Events.subscribe('error', function(text) {
			this.setState({
				errorText: text,
				loading: false,
				loadingText: '',
				success: false
			});
		}.bind(this)));
	},
	componentWillUnmount: function() {
		// remove subscribers
		for(var idx = 0; idx < this.subscriptions.length; idx++) {
			this.subscriptions[idx].remove();
		}
	},

	// subscribers to Events so we can unsubscribe on componentWillUnmount
	subscriptions: [],

	handleClick: function(e) {
		e.preventDefault();
		Events.publish('loading', "Fetching latest code…");
		this.setState({
			fetched: false
		});

		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.context.projectUrl + '/fetch'
		}))
			.then(this.waitForFetchToComplete, this.fetchStatusError)
			.then(function() {
				Events.publish('loading/done');
				this.setState({
					fetched: true
				});
			}.bind(this))
			.catch(this.fetchStatusError)
			.done();
	},
	getFetchStatus: function (fetchData) {
		return Q($.ajax({
			type: "GET",
			url: fetchData.href,
			dataType: 'json'
		}));
	},
	waitForFetchToComplete:function (fetchData) {
		return this.getFetchStatus(fetchData).then(function (data) {
			if (data.status === "Complete") {
				return data;
			}
			if (data.status === "Failed") {
				return $.Deferred(function (d) {
					return d.reject(data);
				}).promise();
			}
			return this.waitForFetchToComplete(fetchData);
		}.bind(this));
	},

	fetchStatusError: function(data) {
		var message = 'Unknown error';
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
			loading: this.state.loading,
			success: this.state.success
		});

		var form;

		if(this.state.errorText !== "") {
			form = <ErrorMessages message={this.state.errorText} />;
		} else if(this.state.fetched) {
			form = (
				<DeployForm
					context={this.props.context}
					data={this.props.data}
					lastFetchedHandler={this.lastFetchedHandler}
				/>
			);
		} else if (this.state.loading) {
			form = <LoadingDeployForm message="Fetching latest code&hellip;" />;
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

function LoadingDeployForm(props) {
	return (
		<div className="deploy-form-loading">
			<div className="icon-holder">
				<i className="fa fa-cog fa-spin"></i>
				<span>{props.message}</span>
			</div>
		</div>
	);
}

function ErrorMessages(props) {
	return (
		<div className="deploy-dropdown-errors">
			{props.message}
		</div>
	);
}

function EnvironmentName(props) {
	return (
		<span className="environment-name">
			<i className="fa fa-rocket">&nbsp;</i>
			Deployment options <span className="hidden-xs">for {props.environmentName}</span>
		</span>
	);
}

var DeployForm = React.createClass({
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
		this.setState({
			loading: true
		});
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.context.gitRevisionsUrl
		})).then(function(data) {
			this.setState({
				loading: false,
				data: data.Tabs,
				selectedTab: data.preselect_tab ? parseInt(data.preselect_tab, 10) : 1,
				preselectSha: data.preselect_sha
			});
			this.props.lastFetchedHandler(data.last_fetched);
		}.bind(this), function(data) {
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
					<DeployTabSelector
						data={this.state.data}
						onSelect={this.selectHandler}
						selectedTab={this.state.selectedTab}
					/>
					<DeployTabs
						context={this.props.context}
						data={this.state.data}
						selectedTab={this.state.selectedTab}
						preselectSha={this.state.preselectSha}
						SecurityToken={this.state.SecurityToken}
					/>
				</form>
			</div>
		);
	}
});

function DeployTabSelector(props) {
	var selectors = props.data.map(function(tab) {
		return (
			<DeployTabSelect
				key={tab.id}
				tab={tab}
				onSelect={props.onSelect}
				selectedTab={props.selectedTab}
			/>
		);
	});
	return (
		<ul className="SelectionGroup tabbedselectiongroup nolabel">
			{selectors}
		</ul>
	);
}

var DeployTabSelect = React.createClass({
	handleClick: function(e) {
		e.preventDefault();
		this.props.onSelect(this.props.tab.id);
	},
	render: function () {
		var classes = Helpers.classNames({
			active : (this.props.selectedTab === this.props.tab.id)
		});
		return (
			<li className={classes}>
				<a
					onClick={this.handleClick}
					href={"#deploy-tab-" + this.props.tab.id}
				>
					{this.props.tab.name}
				</a>
			</li>
		);
	}

});

function DeployTabs(props) {
	var tabs = props.data.map(function(tab) {
		return (
			<DeployTab
				context={props.context}
				key={tab.id}
				tab={tab}
				selectedTab={props.selectedTab}
				preselectSha={props.selectedTab === tab.id ? props.preselectSha : null}
				SecurityToken={props.SecurityToken}
			/>
		);
	});

	return (
		<div className="tab-content">
			{tabs}
		</div>
	);
}

var DeployTab = React.createClass({
	getInitialState: function() {
		var defaultSelectedOptions = [];
		for (var i in this.props.tab.options) {
			var option = this.props.tab.options[i];
			defaultSelectedOptions[option.name] = option.defaultValue;
		}

		return {
			summary: this.getInitialSummaryState(),
			selectedOptions: defaultSelectedOptions,
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
			initialState: true,
			backupChecked: true
		};
	},
	componentDidMount: function() {
		if (this.shaChosen()) {
			this.changeSha(this.state.sha);
		}
	},
	OptionChangeHandler: function(event) {
		var selectedOptions = this.state.selectedOptions;
		selectedOptions[event.target.name] = event.target.checked;
		this.setState({
			selectedOptions: selectedOptions
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
		for (var attrname in this.state.selectedOptions) {
			if(this.state.selectedOptions.hasOwnProperty(attrname)) {
				summaryData[attrname] = this.state.selectedOptions[attrname];
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
		}.bind(this), function() {
			Events.publish('change_loading/done');
		});
	},

	changeHandler: function(event) {
		event.preventDefault();
		if(event.target.value === "") {
			return;
		}
		var sha = ReactDOM.findDOMNode(this.refs.sha_selector.refs.sha).value;
		return this.changeSha(sha);
	},

	shaChosen: function() {
		return (this.state.sha !== '');
	},

	render: function () {
		var classes = Helpers.classNames({
			"tab-pane": true,
			clearfix: true,
			active: (this.props.selectedTab === this.props.tab.id)
		});

		// setup the dropdown or the text input for selecting a SHA
		var selector;
		if (this.props.tab.field_type === 'dropdown') {
			selector = (
				<SelectorDropdown
					ref="sha_selector"
					tab={this.props.tab}
					changeHandler={this.SHAChangeHandler}
					defaultValue={this.state.sha}
				/>
			);
		} else if (this.props.tab.field_type === 'textfield') {
			selector = (
				<SelectorText
					ref="sha_selector"
					tab={this.props.tab}
					changeHandler={this.SHAChangeHandler}
					defaultValue={this.state.sha}
				/>
			);
		}

		return (
			<div id={"deploy-tab-" + this.props.tab.id} className={classes}>
				<div className="section">
					<div htmlFor={this.props.tab.field_id} className="header">
						<span className="numberCircle">1</span> {this.props.tab.field_label}
					</div>
					{selector}
					<DeployOptions
						tab={this.props.tab}
						changeHandler={this.OptionChangeHandler}
						options={this.props.tab.options}
						selectedOptions={this.state.selectedOptions}
					/>
					<VerifyButton disabled={!this.shaChosen()} changeHandler={this.changeHandler} />
				</div>
				<DeployPlan context={this.props.context} summary={this.state.summary} />
			</div>
		);
	}
});

var SelectorDropdown = React.createClass({
	componentDidMount: function() {
		$(ReactDOM.findDOMNode(this.refs.sha)).select2({
			// Load data into the select2.
			// The format supports optgroups, and looks like this:
			// [{text: 'optgroup text', children: [{id: '<sha>', text: '<inner text>'}]}]
			data: this.props.tab.field_data
		}).val(this.props.defaultValue);

		if(this.props.changeHandler) {
			$(ReactDOM.findDOMNode(this.refs.sha)).select2().on("change", this.props.changeHandler);
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
						style={style}
					>
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
					defaultValue={this.props.defaultValue}
					onChange={this.props.changeHandler}
				/>
			</div>
		);
	}
});

function VerifyButton(props) {
	return (
		<div>
			<button
				disabled={props.disabled}
				value="Verify deployment"
				className="btn btn-default"
				onClick={props.changeHandler}
			>
				Verify deployment
			</button>
		</div>
	);
}

function DeployOptions(props) {
	var options = [];
	for (var i in props.options) {
		var name = props.options[i].name;
		var title = props.options[i].title;
		var checked = false;

		for (var optionName in props.selectedOptions) {
			if (optionName === name) {
				checked = props.selectedOptions[optionName];
			}
		}

		options.push(
			<DeployOption
				key={i}
				changeHandler={props.changeHandler}
				name={name}
				title={title}
				checked={checked}
			/>
		);
	}

	return (
		<div className="deploy-options">
			{options}
		</div>
	);
}

function DeployOption(props) {
	return (
		<div className="fieldcheckbox">
			<label htmlFor={props.name}>
				<input
					type="checkbox"
					name={props.name}
					id={props.name}
					checked={props.checked}
					onChange={props.changeHandler}
				/>
				{props.title}
			</label>
		</div>
	);
}

module.exports = DeploymentDialog;
