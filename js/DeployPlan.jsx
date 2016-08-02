var React = require("react");

var Events = require('./events.js');
var Helpers = require('./helpers.js');
var SummaryTable = require('./SummaryTable.jsx');

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

		var headerClasses = Helpers.classNames({
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
		var extraDefinitions = [];
		if (this.props.summary.estimatedTime && this.props.summary.estimatedTime>0) {
			extraDefinitions.push(<dt key="duration_term">Duration:</dt>);
			extraDefinitions.push(<dd key="duration_definition">{this.props.summary.estimatedTime} min approx.</dd>);
		}

		var dlClasses = Helpers.classNames({
			activated: this.props.activated,
			'quick-summary': true
		});

		var moreInfo = null;
		if (typeof this.props.context.deployHelp!=='undefined' && this.props.context.deployHelp) {
			moreInfo = (
				<a target="_blank" className="small" href={this.props.context.deployHelp}>more info</a>
			);
		}

		var env;
		if (this.props.context.siteUrl) {
			env = <a target="_blank" href={this.props.context.siteUrl}>{this.props.context.envName}</a>;
		} else {
			env = <span>{this.props.context.envName}</span>;
		}

		return (
			<dl className={dlClasses}>
				<dt>Environment:</dt>
				<dd>{env}</dd>
				<dt>Deploy type:</dt>
				<dd>{type} {moreInfo}</dd>
				{extraDefinitions}
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

module.exports = DeployPlan;
