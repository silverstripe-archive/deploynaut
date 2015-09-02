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
function classNames () {

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

/**
 * A simple pub sub event handler for intercomponent communication
 *
 * @type {{subscribe, publish}}
 */
var events = (function(){
	var topics = {};
	var hOP = topics.hasOwnProperty;

	return {
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
})();

/**
 * DeployDropdown
 */
var DeployDropDown = React.createClass({

	loadingSubscriber: null,

	loadingDone: null,

	error: null,

	getInitialState: function() {
		return {
			loading: false,
			loaded: false,
			opened: false,
			loadingText: "",
			errorText: "",
			fetched: false
		};
	},
	componentDidMount: function() {
		var self = this;
		// register subscribers
		this.loading = events.subscribe('loading', function(text) {
			self.setState({
				loading: true,
				opened: false,
				success: false,
				loadingText: text
			});
		});
		this.loadingDone = events.subscribe('loading/done', function() {
			self.setState({
				loading: false,
				loadingText: '',
				success: true,
				opened: true
			});
		});
		this.error = events.subscribe('error', function(text) {
			self.setState({
				errorText: text,
				loading: false,
				loadingText: '',
				success: false,
				opened: false
			});
		});
	},
	componentWillUnmount: function() {
		// remove subscribers
		this.loading.remove();
		this.loadingDone.remove();
		this.error.remove();
	},
	handleClick: function(e) {
		e.preventDefault();
		events.publish('loading', "Fetching latest code…");
		this.setState({
			fetched: false
		});
		var self = this;
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.project_url + '/fetch'
		}))
			.then(this.waitForFetchToComplete, this.fetchStatusError)
			.then(function() {
				events.publish('loading/done');
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
		events.publish('error', message);
	},
	render: function() {
		var classes = classNames({
			"deploy-dropdown": true,
			"loading": this.state.loading,
			"open": this.state.opened,
			"success": this.state.success
		});

		var form;
		if(this.state.errorText !== "") {
			form = <ErrorMessages message={this.state.errorText} />
		} else if(this.state.fetched) {
			form = <DeployForm data={this.props.data} env_url={this.props.env_url} SecurityToken={this.props.SecurityToken} />
		}

		return (
			<div>
				<div className={classes} onClick={this.handleClick}>
					<span className="status-icon" aria-hidden="true"></span>
					<span className="loading-text">{this.state.loadingText}</span>
					<EnvironmentName environmentName={this.props.env_name} />
				</div>
				{form}
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
			data: [],
		};
	},
	componentDidMount: function() {
		this.gitData();
	},

	gitData: function() {
		var self = this;
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.env_url + '/git_revisions',
			data: { 'SecurityID': self.props.SecurityToken }
		})).then(function(data) {
			self.setState({
				data: data.Tabs,
				SecurityToken: data.SecurityID
			});
		}, function(data){
			events.publish('error', data);
		});
	},

	selectHandler: function(id) {
		this.setState({selectedTab: id});
	},
	render: function () {
		return (
			<div className="deploy-form-outer clearfix">
				<form className="form-inline deploy-form" action="POST" action="#">
					<DeployTabSelector data={this.state.data} onSelect={this.selectHandler} selectedTab={this.state.selectedTab} />
					<DeployTabs data={this.state.data} selectedTab={this.state.selectedTab} env_url={this.props.env_url} SecurityToken={this.state.SecurityToken} />
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
		var classes = classNames({
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
				<DeployTab key={tab.id} tab={tab} selectedTab={self.props.selectedTab} env_url={self.props.env_url} SecurityToken={self.props.SecurityToken} />
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

		events.publish('loading', "Calculating changes…");

		var summaryData = {
			sha: React.findDOMNode(this.refs.sha_selector.refs.sha).value,
			SecurityID: this.props.SecurityToken
		};
		// merge the 'advanced' options if they are set
		for (var attrname in this.state.options) {
			summaryData[attrname] = this.state.options[attrname];
		}
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.env_url + '/deploy_summary',
			data: summaryData
		})).then(function(data) {
			this.setState({
				summary: data
			});
			events.publish('loading/done');
		}.bind(this), function(data){
			events.publish('loading/done');
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
		var classes = classNames({
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
				<DeployPlan summary={this.state.summary} env_url={this.props.env_url} />
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
			<div>
				<button
					disabled={this.props.disabled}
					value="Verify deployment"
					className="btn-lg btn-default btn check-button"
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

/**
 * DeployPlan
 */
var DeployPlan = React.createClass({
	deployHandler: function(event) {
		event.preventDefault();
		//@todo(stig): add a confirmation box
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.env_url + '/start-deploy',
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
	canDeploy: function() {
		return (this.props.summary.validationCode==="success" || this.props.summary.validationCode==="warning");
	},
	isEmpty: function(obj) {
		for(var p in obj){
			return false;
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
		return(
			<div>
				<div className="section">
					<div className="header"><span className="numberCircle">2</span> Review changes</div>
					<MessageList messages={messages} />
					<SummaryTable changes={this.props.summary.changes} />
				</div>
				<div className="section">
					<button
						value="Confirm Deployment"
						className="action btn btn-primary deploy-button"
						disabled={!this.canDeploy()}
						onClick={this.deployHandler}>
							{this.actionTitle()}<br/>
							<EstimatedTime estimatedTime={this.props.summary.estimatedTime} />
					</button>
				</div>
			</div>
		)
	}
});

/**
 * EstimatedTime
 */
var EstimatedTime = React.createClass({
	render: function() {
		if (this.props.estimatedTime && this.props.estimatedTime>0) {
			return (
				<small>Estimated {this.props.estimatedTime} min</small>
			);
		}
		return null;
	}
});

var MessageList = React.createClass({
	render: function() {
		if(this.props.messages.length < 1) {
			return null;
		}
		if(typeof this.props.messages === 'undefined') {
			return null;
		}
		var idx = 0;
		var messages = this.props.messages.map(function(message) {
			return <Message key={idx} message={message} />
			idx++;
		});
		return (
			<div>
				{messages}
			</div>
		)
	}
});

var Message = React.createClass({
	render: function() {
		var classMap = {
			'error': 'alert alert-danger',
			'warning': 'alert alert-warning',
			'success': 'alert alert-info'
		};
		var classname=classMap[this.props.message.code];
		return (
			<div className={classname} role="alert">
				{this.props.message.text}
			</div>
		)
	}
});

/**
 * @jsx React.DOM
 */
var SummaryTable = React.createClass({
	isEmpty: function(obj) {
		for(var p in obj){
			return false;
		}
		return true;
	},
	render: function() {
		var changes = this.props.changes;
		if(this.isEmpty(changes)) {
			return null;
		}
		var i = 0;
		var summaryLines = Object.keys(changes).map(function(key) {
			i++;
			return (
				<SummaryLine key={i} name={key} from={changes[key].from} to={changes[key].to} />
			)
		});

		return (
			<table className="table table-striped table-hover">
				<thead>
					<tr>
						<th>&nbsp;</th>
						<th>From</th>
						<th>To</th>
						</tr>
				</thead>
				<tbody>
					{summaryLines}
				</tbody>
			</table>
		);
	}
});

/**
 * SummaryLine
 */
var SummaryLine = React.createClass({
	render: function() {
		var from = "-",
			to = "-";

		if(this.props.from !== null) {
			from = this.props.from.substring(0,30);
		}
		if(this.props.to !== null) {
			to = this.props.to.substring(0,30);
		}
		return (
			<tr>
				<th scope="row">{this.props.name}</th>
				<td>{from}</td>
				<td>{to}</td>
			</tr>
		)
	}
});

if (typeof urls != 'undefined') {
	React.render(
		<DeployDropDown
			project_url = {urls.project_url}
			env_url = {urls.env_url}
			env_name = {urls.env_name}
			SecurityToken = {security_token} />,
			document.getElementById('deploy_form')
	);
}
