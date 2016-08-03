/* global Q */

var React = require("react");

var Events = require('./events.js');
var Helpers = require('./helpers.js');
var SummaryTable = require('./SummaryTable.jsx');

var DeployPlan = React.createClass({

	getInitialState: function() {
		return {
			loading_changes: false,
			deploy_disabled: false,
			deployHover: false
		};
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
	loadingSub: null,
	loadingDoneSub: null,
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
				strategy: this.props.summary,
				SecurityID: this.props.summary.SecurityID
			}
		})).then(function(data) {
			window.location = data.url;
		}, function(data) {
			console.error(data);
		});
	},
	mouseEnterHandler: function() {
		this.setState({deployHover: true});
	},
	mouseLeaveHandler: function() {
		this.setState({deployHover: false});
	},
	canDeploy: function() {
		return (this.props.summary.validationCode === "success" || this.props.summary.validationCode === "warning");
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
		if (typeof actionTitle === 'undefined' || actionTitle === '') {
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
				<div
					className="section"
					onMouseEnter={this.mouseEnterHandler}
					onMouseLeave={this.mouseLeaveHandler}
				>
						<button
							value="Confirm Deployment"
							className="deploy pull-left"
							disabled={this.state.deploy_disabled}
							onClick={this.deployHandler}
						>
							{this.actionTitle()}
						</button>
						<QuickSummary
							activated={this.state.deployHover}
							context={this.props.context}
							summary={this.props.summary}
						/>
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
						<span className="numberCircle">2</span>
						Review changes
					</div>
					<MessageList messages={messages} />
					<SummaryTable changes={this.props.summary.changes} />
				</div>
				{deployAction}
			</div>
		);
	}
});

function QuickSummary(props) {

	var type = (props.summary.actionCode === 'fast' ? 'code-only' : 'full');
	var extraDefinitions = [];
	if(props.summary.estimatedTime && props.summary.estimatedTime > 0) {
		extraDefinitions.push(<dt key="duration_term">Duration:</dt>);
		extraDefinitions.push(
			<dd key="duration_definition">{props.summary.estimatedTime} min approx.</dd>);
	}

	var dlClasses = Helpers.classNames({
		activated: props.activated,
		'quick-summary': true
	});

	var moreInfo = null;
	if(typeof props.context.deployHelp !== 'undefined' && props.context.deployHelp) {
		moreInfo = (
			<a
				target="_blank"
				className="small"
				href={props.context.deployHelp}
				rel="noopener noreferrer"
			>
				more info
			</a>
		);
	}

	var env;
	if(props.context.siteUrl) {
		env = (
			<a
				target="_blank"
				href={props.context.siteUrl}
				rel="noopener noreferrer"
			>
				{props.context.envName}
			</a>
		);
	} else {
		env = <span>{props.context.envName}</span>;
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
			return <Message key={idx} message={message} />;
		});
		return (
			<div>
				{messages}
			</div>
		);
	}
});

function Message(props) {
	var classMap = {
		error: 'alert alert-danger',
		warning: 'alert alert-warning',
		success: 'alert alert-info'
	};
	var classname = classMap[props.message.code];
	return (
		<div
			className={classname}
			role="alert"
			dangerouslySetInnerHTML={{__html: props.message.text}}
		/>
	);
}

module.exports = DeployPlan;
