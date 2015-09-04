/** @jsx React.DOM */

var deploy = (function (events, classNames) {
	/**
	 * DeployDropdown
	 */
	var DeployDropDown = React.createClass({

		loadingSub: null,

		loadingDoneSub: null,

		errorSub: null,

		getInitialState: function() {
			return {
				loading: false,
				loaded: false,
				opened: false,
				loadingText: "",
				errorText: "",
				fetched: true,
				last_fetched: ""
			};
		},
		componentDidMount: function() {
			var self = this;
			// add subscribers
			this.loadingSub = events.subscribe('loading', function(text) {
				self.setState({
					loading: true,
					opened: false,
					success: false,
					loadingText: text
				});
			});
			this.loadingDoneSub = events.subscribe('loading/done', function() {
				self.setState({
					loading: false,
					loadingText: '',
					success: true,
					opened: true
				});
			});
			this.errorSub = events.subscribe('error', function(text) {
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
			this.loadingSub.remove();
			this.loadingDoneSub.remove();
			this.errorSub.remove();
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
		lastFetchedHandler: function(time_ago) {
			this.setState({last_fetched: time_ago});
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
				form = <DeployForm data={this.props.data} env_url={this.props.env_url} lastFetchedHandler={this.lastFetchedHandler} />
			}

			return (
				<div>
					<div className={classes} onClick={this.handleClick}>
						<span className="status-icon" aria-hidden="true"></span>
						<span className="time">last updated {this.state.last_fetched}</span>
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
				data: []
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
				url: this.props.env_url + '/git_revisions'
			})).then(function(data) {
				self.setState({
					data: data.Tabs
				});
				self.props.lastFetchedHandler(data.last_fetched);
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

			events.publish('change_loading');

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
				url: this.props.env_url + '/deploy_summary',
				data: summaryData
			})).then(function(data) {
				this.setState({
					summary: data
				});
				events.publish('change_loading/done');
			}.bind(this), function(){
				events.publish('change_loading/done');
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
				<div className="">
					<button
						disabled={this.props.disabled}
						value="Verify deployment"
						className="btn btn-default"
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
		loadingSub: null,
		loadingDoneSub: null,
		getInitialState: function() {
			return {
				loading_changes: false
			}
		},
		componentDidMount: function() {
			var self = this;
			// register subscribers
			this.loadingSub = events.subscribe('change_loading', function () {
				self.setState({
					loading_changes: true
				});
			});
			this.loadingDoneSub = events.subscribe('change_loading/done', function () {
				self.setState({
					loading_changes: false
				});
			});
		},
		deployHandler: function(event) {
			event.preventDefault();
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
					<div className="section">
						<button
						value="Confirm Deployment"
						className="deploy"
						disabled={!this.canDeploy()}
						onClick={this.deployHandler}>
						{this.actionTitle()}<br/>
							<EstimatedTime estimatedTime={this.props.summary.estimatedTime} />
						</button>
					</div>
				);
			}

			var headerClasses = classNames({
				header: true,
				inactive: !this.canDeploy(),
				loading: this.state.loading_changes
			});

			return(
				<div>
					<div className="section">
						<div className={headerClasses}>
							<span className="status-icon"></span>
							<span className="numberCircle">2</span> Review changes
						</div>
						<MessageList messages={messages} />
						<SummaryTable changes={this.props.summary.changes} />
					</div>
					{deployAction}
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
				idx++;
				return <Message key={idx} message={message} />
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
				<div className={classname} role="alert"
					dangerouslySetInnerHTML={{__html: this.props.message.text}} />
			)
		}
	});

	/**
	 * @jsx React.DOM
	 */
	var SummaryTable = React.createClass({
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
				if(changes[key].from != changes[key].to) {
					return <SummaryLine key={idx} name={key} from={changes[key].from} to={changes[key].to} />
				} else {
					return <UnchangedSummaryLine key={idx} name={key} value={changes[key].from} />
				}
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

			return (
				<tr>
					<th scope="row">{this.props.name}</th>
					<td>{from}</td>
					<td>{to}</td>
				</tr>
			)
		}
	});

	var UnchangedSummaryLine = React.createClass({
		render: function() {
			var from = this.props.value;
			// naive git sha detection
			if(from !== null && from.length === 40) {
				from = from.substring(0,7);
			}

			return (
				<tr>
					<th scope="row">{this.props.name}</th>
					<td>{from}</td>
					<td>
						<span className="label label-success">Unchanged</span>
					</td>
				</tr>
			);
		}
	});

	return {
		render: function(urls) {
			React.render(
				<DeployDropDown
					project_url = {urls.project_url}
					env_url = {urls.env_url}
					env_name = {urls.env_name} />,
				document.getElementById('deploy_form')
			);
		}
	}
}(events, classNames));

if (typeof urls != 'undefined') {
	deploy.render(urls);
}
