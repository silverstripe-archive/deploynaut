var React = require('react');
var ReactRedux = require('react-redux');

var StepMenu = require('../components/StepMenu.jsx');
var GitRefSelector = require('./GitRefSelector.jsx');
var ButtonGitUpdate = require('./buttons/GitUpdate.jsx');
var SummaryOfChanges = require('./SummaryOfChanges.jsx');
var Approval = require('./Approval.jsx');
var Deployment = require('./Deployment.jsx');
var DeployPlan = require('./DeployPlan.jsx');
var Messages = require('../components/Messages.jsx');
var Modal = require('../Modal.jsx');

var actions = require('../_actions.js');

function calculateSteps(props) {
	return [
		{
			show: true,
			title: "Target Release",
			is_loading: props.is_loading[0],
			is_finished: props.is_finished[0],
			content: (
				<div>
					<ButtonGitUpdate />
					<GitRefSelector />
				</div>
			)
		},
		{
			title: "Deployment Plan",
			show: props.sha_selected,
			is_loading: props.is_loading[1],
			is_finished: props.is_finished[1],
			content: (
				<div>
					<SummaryOfChanges />
					<DeployPlan />
				</div>
			)
		},
		{
			title: "Approval",
			show: props.plan_success,
			is_loading: props.is_loading[2],
			is_finished: props.is_finished[2],
			content: (
				<div>
					<Approval />
				</div>
			)
		},
		{
			title: "Deployment",
			show: props.sha_selected && props.can_deploy,
			is_loading: props.is_loading[3],
			is_finished: props.is_finished[3],
			content: (
				<div>
					<Deployment />
				</div>
			)
		}
	];
}

function DeployModal(props) {
	var steps = calculateSteps(props);

	const content = (
		<div className="deploy-form">
			<div className="header">
				<span className="numberCircle">{steps[props.active_step].id}</span> {steps[props.active_step].title}
			</div>
			<Messages
				messages={props.messages}
			/>
			<div>
				{steps[props.active_step].content}
			</div>
		</div>
	);

	return (
		<Modal show={props.is_open} closeHandler={props.onClose} title="Deployment">
			<div className="row">
				<div className="col-md-12">
					<h3>Deployment options for ...</h3>
				</div>
				<div className="col-md-3">
					<StepMenu
						steps={steps}
						value={props.active_step}
						onClick={props.onTabClick}
					/>
				</div>
				<div className="col-md-9">
					{content}
				</div>
			</div>
		</Modal>
	);
}

const mapStateToProps = function(state) {

	function deployPlanIsOk() {
		return state.plan.validation_code === 'success' || state.plan.validation_code === 'warning';
	}

	function isApproved() {
		return state.approval.approved || state.approval.bypassed;
	}

	return {
		is_loading: [
			state.git.is_loading || state.git.is_updating,
			state.plan.is_loading,
			false,
			state.deployment.enqueued
		],
		is_finished: [
			state.git.selected_ref !== "",
			deployPlanIsOk(),
			deployPlanIsOk() && isApproved(),
			false
		],
		is_open: state.navigation.open,
		plan_success: state.plan.validation_code === 'success',
		messages: state.messages,
		active_step: state.navigation.active,
		sha_selected: (state.git.selected_ref !== ""),
		can_deploy: (state.approval.approved || state.approval.bypassed)
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onClose: function() {
			dispatch(actions.closePlanDialog());
		},
		onTabClick: function(id) {
			dispatch(actions.setActiveStep(id));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(DeployModal);
