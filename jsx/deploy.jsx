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


function isEmpty(obj) {
	for(var p in obj){
		return false;
	}
	return true;
};

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

	getInitialState: function() {
		return {
			loading: false,
			loaded: false,
			opened: false,
			loadingText: ""
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
	},
	componentWillUnmount: function() {
		// remove subscribers
		this.loading.remove();
		this.loadingDone.remove();
	},
	handleClick: function(e) {
		e.preventDefault();
		events.publish('loading', "Fetching latest code…");
		var self = this;
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.project_url + '/fetch'
		}))
			.then(this.waitForFetchToComplete, this.fetchStatusError)
			.then(function() {
				events.publish('loading/done');
			}).catch(function(data){
				console.error(data);
			}).done();
	},
	waitForFetchToComplete:function (fetchData) {
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
	getFetchStatus: function (fetchData) {
		return Q($.ajax({
			type: "GET",
			url: fetchData.href,
			dataType: 'json'
		}));
	},
	fetchStatusError: function(data) {
		console.error(data);
	},
	render: function() {
		var classes = classNames({
			"deploy-dropdown": true,
			"loading": this.state.loading,
			"open": this.state.opened,
			"success": this.state.success
		});
		return (
			<div>
				<div className={classes} onClick={this.handleClick}>
					<span className="status-icon" aria-hidden="true"></span>
					<span className="loading-text">{this.state.loadingText}</span>
					<EnvironmentName environmentName="" />
				</div>
				<DeployForm data={this.props.data} env_url={this.props.env_url} />
			</div>
		);
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
			url: this.props.env_url + '/git_revisions'
		})).then(function(data) {
			self.setState({
				data: data
			});
		}, function(data){
			console.error(data);
		});
	},

	selectHandler: function(id) {
		this.setState({selectedTab: id});
	},
	render: function () {
		return (
			<div className="deploy-form-outer clearfix collapse in">
				<form className="form-inline deploy-form" action="POST" action="#">
					<DeployTabSelector data={this.state.data} onSelect={this.selectHandler} selectedTab={this.state.selectedTab} />
					<DeployTabs data={this.state.data} selectedTab={this.state.selectedTab} env_url={this.props.env_url} />
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
				<DeployTab key={tab.id} tab={tab}  selectedTab={self.props.selectedTab} env_url={self.props.env_url} />
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
			summary: {
				changes: {},
				messages: [],
				validationCode: '',
				estimatedTime: null,
				initialState: true,
			},
		};
	},
	componentDidMount: function() {
		if (this.props.tab.field_type==='dropdown') {
			$(React.findDOMNode(this.refs.sha_selector)).select2({
				// Load data into the select2.
				// The format supports optgroups, and looks like this:
				// [{text: 'optgroup text', children: [{id: '<sha>', text: '<inner text>'}]}]
				data: this.props.tab.field_data
			});
		}

		$(React.findDOMNode(this.refs.sha_selector)).select2().on("change", this.changeHandler);
	},
	changeHandler: function(event) {
		event.preventDefault();

		this.setState(this.getInitialState());
		if(event.target.value === "") {
			return;
		}
		events.publish('loading', "Calculating changes…");
		var self = this;
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.env_url + '/deploy_summary',
			data: {'sha': React.findDOMNode(this.refs.sha_selector).value}
		})).then(function(data) {
			self.setState({
				summary: data
			});
			events.publish('loading/done');
		}, function(data){
			events.publish('loading/done');
		});
	},

	render: function () {
		var classes = classNames({
			"tab-pane": true,
			"clearfix": true,
			"active" : (this.props.selectedTab == this.props.tab.id)
		});

		var selector;
		switch(this.props.tab.field_type) {
			case 'dropdown':
				// From https://select2.github.io/examples.html "The best way to ensure that Select2 is using a percent based
				// width is to inline the style declaration into the tag".
				var style = {width: '100%'};
				selector = (
					<select ref="sha_selector" id={this.props.tab.field_id} name="sha" className="dropdown"
						onChange={this.changeHandler} style={style}>
						<option value="">Select {this.props.tab.field_id}</option>
					</select>
				)
				// Data is loaded in componentDidMount
				break;

			case 'textfield':
				selector = (
					<div>
						<input ref="sha_selector" type="text" ref="sha_selector" id={this.props.tab.field_id} name="sha" className="text" />
						<button value="Check SHA" className="btn-lg btn-default btn check-button" onClick={this.changeHandler}>
							Check SHA
						</button>
					</div>
				)
				break;
		}

		return (
			<div id={"deploy-tab-"+this.props.tab.id} className={classes}>
				<div className="section">
					<label htmlFor={this.props.tab.field_id} ><span className="numberCircle">1</span> {this.props.tab.field_label}</label>
					<div className="field">
						{selector}
					</div>
				</div>
				<DeployPlan summary={this.state.summary} env_url={this.props.env_url} />
			</div>
		);
	}
});

/**
 * DeployPlan
 */
var DeployPlan = React.createClass({
	submitHandler: function(event) {
		event.preventDefault();
		Q($.ajax({
			type: "POST",
			dataType: 'json',
			url: this.props.env_url + '/start-deploy',
			data: {
				// Pass the strategy object the user has just signed off back to the backend.
				'strategy': this.props.summary
			}
		})).then(function(data) {
			window.location = data.url;
		}, function(data){
			console.error(data);
		});
	},
	render: function() {
		var changes = this.props.summary.changes;
		var messages = this.props.summary.messages;
		var canDeploy = (this.props.summary.validationCode==="success" || this.props.summary.validationCode==="warning");

		var messageList = [];
		if (typeof messages !== 'undefined' && messages.length > 0) {
			messageList = messages.map(function(message) {
				return (
					<div className={message.code=='error'?'alert alert-danger':'alert alert-warning'} role="alert">
						{message.text}
					</div>
				)
			});
		}
		if (!isEmpty(changes)) {
			var changeBlock = <SummaryTable changes={changes} />
		} else if (!this.props.summary.initialState && messageList.length===0) {
			var changeBlock = <div className="alert alert-info" role="alert">There are no changes but you can deploy anyway if you wish.</div>
		}

		return(
			<div>
				<div className="section">
					<label><span className="numberCircle">2</span> Review changes</label>
					{messageList}
					{changeBlock}
				</div>
				<div className="section">
					<button
						value="Confirm Deployment"
						className="action btn btn-primary deploy-button"
						disabled={!canDeploy}
						onClick={this.submitHandler}>
							{this.props.summary.actionTitle ? this.props.summary.actionTitle : 'Make a selection'}<br/>
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
		var estimatedTime = this.props.estimatedTime;
		if (estimatedTime && estimatedTime>0) {
			return (
				<small>Estimated {estimatedTime} min</small>
		);
		}

		return null;
	}
});

/**
 * SummaryTable
 */
var SummaryTable = React.createClass({
	render: function() {
		var i = 0;
		var changes = this.props.changes;

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
						<th></th>
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

/**
 * Render
 */
React.render(
	<DeployDropDown project_url={urls.project_url} env_url={urls.env_url} />,
	document.getElementById('deploy_form')
);

