var React = require("react");
var ReactRedux = require('react-redux');

var StepMenu = require('../components/StepMenu.jsx');
var GitRefSelector = require('./GitRefSelector.jsx');
var ButtonGitFetch = require('./buttons/GitFetch.jsx');
var ButtonGitUpdate = require('./buttons/GitUpdate.jsx');
var SummaryOfChanges = require('./SummaryOfChanges.jsx');
var Approval = require('./Approval.jsx');
var Deployment = require('./Deployment.jsx');
var DeployPlan = require('./DeployPlan.jsx');

var actions = require('../_actions.js');

function calculateSteps(props) {

	return [
		{
			id: 1,
			show: true,
			title: "Target Release",
			content: (
				<div>
					<ButtonGitFetch />
					<ButtonGitUpdate />
					<GitRefSelector />
				</div>
			)
		},
		{
			id: 2,
			title: "Deployment Plan",
			show: props.shaSelected,
			content: (
				<div>
					<SummaryOfChanges />
					<DeployPlan />
				</div>
			)
		},
		{
			id: 3,
			title: "Approval",
			show: props.shaSelected,
			content: (
				<div>
					<Approval />
				</div>
			)
		},
		{
			id: 4,
			title: "Deployment",
			show: props.shaSelected && props.canDeploy,
			content: (
				<div>
					<Deployment />
				</div>
			)
		}
	];
}

function Message(props) {

	if(!props.message) {
		return null;
	}
	var message = null;
	if(typeof props.message === 'object') {
		message = Object.keys(props.message).map(function(key) {
			return <div key={key}>{props.message[key]}</div>;
		});
	} else {
		message = props.message;
	}
	return (
		<div className={"alert alert-" + props.type} >
			{message}
		</div>
	);
}

function App(props) {

	var steps = calculateSteps(props);
	const content = (
		<div className="deploy-form">
			<div className="header">
				<span className="numberCircle">{steps[props.activeStep].id}</span> {steps[props.activeStep].title}
			</div>
			<Message
				message={props.message}
				type={props.messageType}
			/>
			<div>
				{steps[props.activeStep].content}
			</div>
		</div>
	);

	return (
		<div className="row">
			<div className="col-md-12">
				<h3>Deployment options for ...</h3>
			</div>
			<div className="col-md-3">
				<StepMenu
					tabs={steps}
					value={props.activeStep}
					onClick={props.onTabClick}
				/>
			</div>
			<div className="col-md-9">
				{content}
			</div>
		</div>
	);
}

const mapStateToProps = function(state) {
	return {
		message: state.message,
		messageType: state.message_type,
		activeStep: state.activeStep,
		shaSelected: (state.git.selected_ref !== ""),
		canDeploy: (state.approval.approved || state.approval.bypassed),
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onTabClick: function(id) {
			dispatch(actions.setActiveStep(id));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(App);
