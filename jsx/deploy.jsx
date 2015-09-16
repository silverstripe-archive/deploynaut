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
					success: false,
					loadingText: text
				});
			});
			this.loadingDoneSub = events.subscribe('loading/done', function() {
				self.setState({
					loading: false,
					loadingText: '',
					success: true
				});
			});
			this.errorSub = events.subscribe('error', function(text) {
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
			events.publish('loading', "Fetching latest code…");
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
				"success": this.state.success
			});

			var form;

			if(this.state.errorText !== "") {
				form = <ErrorMessages message={this.state.errorText} />
			} else if(this.state.fetched) {
				form = <DeployForm context={this.props.context} data={this.props.data} lastFetchedHandler={this.lastFetchedHandler} />
			} else if (this.state.loading) {
				form = <LoadingDeployForm message="Fetching latest code&hellip;" />
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

	var LoadingDeployForm = React.createClass({
		render: function() {
			return (
				<div className="deploy-form-loading">
					<div className="icon-holder">
						<i className="fa fa-cog fa-spin"></i>
						<span>{this.props.message}</span>
					</div>
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
				events.publish('error', data);
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
						<DeployTabSelector data={this.state.data} onSelect={this.selectHandler} selectedTab={this.state.selectedTab} />
						<DeployTabs context={this.props.context} data={this.state.data} selectedTab={this.state.selectedTab} SecurityToken={this.state.SecurityToken} />
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
					<DeployTab context={self.props.context} key={tab.id} tab={tab} selectedTab={self.props.selectedTab} SecurityToken={self.props.SecurityToken} />
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
				url: this.props.context.envUrl + '/deploy_summary',
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
					<DeployPlan context={this.props.context} summary={this.state.summary} />
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
				loading_changes: false,
				deploy_disabled: false,
				deployHover: false
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
					<div className="section"
						onMouseEnter={this.mouseEnterHandler}
						onMouseLeave={this.mouseLeaveHandler}>
							<button
								value="Confirm Deployment"
								className="deploy pull-left"
								disabled={this.state.deploy_disabled}
								onClick={this.deployHandler}>
								{this.actionTitle()}
							</button>
							<QuickSummary activated={this.state.deployHover} context={this.props.context} summary={this.props.summary} />
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

	var QuickSummary = React.createClass({
		render: function() {
			var type = (this.props.summary.actionCode==='fast' ? 'code-only' : 'full');
			var estimate = [];
			if (this.props.summary.estimatedTime && this.props.summary.estimatedTime>0) {
				estimate = [
					<dt>Duration:</dt>,
					<dd>{this.props.summary.estimatedTime} min approx.</dd>
				];
			}

			var dlClasses = classNames({
				activated: this.props.activated,
				'quick-summary': true
			});

			var moreInfo = null;
			if (typeof this.props.context.deployHelp!=='undefined' && this.props.context.deployHelp) {
				moreInfo = (
					<a target="_blank" className="small" href={this.props.context.deployHelp}>more info</a>
				);
			}

			if (this.props.context.siteUrl) {
				var env = <a target="_blank" href={this.props.context.siteUrl}>{this.props.context.envName}</a>;
			} else {
				var env = <span>{this.props.context.envName}</span>;
			}

			return (
				<dl className={dlClasses}>
					<dt>Environment:</dt>
					<dd>{env}</dd>
					<dt>Deploy type:</dt>
					<dd>{type} {moreInfo}</dd>
					{estimate}
				</dl>
			);
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

				var compareUrl = null;
				if(typeof changes[key].compareUrl != 'undefined') {
					compareUrl = changes[key].compareUrl;
				}

				if(typeof changes[key].description!=='undefined') {

					if (changes[key].description!=="") {
						return <DescriptionOnlySummaryLine key={idx} name={key} description={changes[key].description} />
					} else {
						return <UnchangedSummaryLine key={idx} name={key} value="" />
					}

				} else if(changes[key].from != changes[key].to) {
					return <SummaryLine key={idx} name={key} from={changes[key].from} to={changes[key].to} compareUrl={compareUrl} />
				} else {
					return <UnchangedSummaryLine key={idx} name={key} value={changes[key].from} />
				}
			});

			return (
				<table className="table table-striped table-hover">
					<thead>
						<tr>
							<th>&nbsp;</th>
							<th>&nbsp;</th>
							<th className="transitionIcon">&nbsp;</th>
							<th>&nbsp;</th>
							<th className="changeAction">&nbsp;</th>
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

			var compareUrl = null;
			if(this.props.compareUrl !== null) {
				compareUrl = <a target="_blank" href={this.props.compareUrl}>View diff</a>
			}

			return (
				<tr>
					<th scope="row">{this.props.name}</th>
					<td>{from}</td>
					<td><span className="glyphicon glyphicon-arrow-right" /></td>
					<td>{to}</td>
					<td className="changeAction">{compareUrl}</td>
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
					<td>&nbsp;</td>
					<td><span className="label label-success">Unchanged</span></td>
					<td>&nbsp;</td>
				</tr>
			);
		}
	});

	var DescriptionOnlySummaryLine = React.createClass({
		render: function() {
			return (
				<tr>
					<th scope="row">{this.props.name}</th>
					<td colSpan="4" dangerouslySetInnerHTML={{__html: this.props.description}} />
				</tr>
			);
		}
	});

	return {
		render: function(context) {
			React.render(
				<DeployDropDown
					context = {context} />,
				document.getElementById('deploy_form')
			);
		}
	}
}(events, classNames));

if (typeof context != 'undefined') {
	deploy.render(context);
}
