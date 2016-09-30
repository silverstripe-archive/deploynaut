const React = require('react');
const ReactRedux = require('react-redux');

const StepMenu = require('../components/StepMenu.jsx');
const GitRefSelector = require('./GitRefSelector.jsx');
const ButtonGitUpdate = require('./buttons/GitUpdate.jsx');

const Approval = require('./Approval.jsx');
const Deployment = require('./Deployment.jsx');
const DeployPlan = require('./DeployPlan.jsx');
const Messages = require('../components/Messages.jsx');
const Modal = require('../Modal.jsx');

const actions = require('../_actions.js');
const constants = require('../constants/deployment.js');

function calculateSteps(props) {
	return [
		{
			show: true,
			title: "Target Release",
			is_loading: props.is_loading[0],
			is_finished: props.is_finished[0]
		},
		{
			title: "Deployment Plan",
			show: props.sha_is_selected,
			is_loading: props.is_loading[1],
			is_finished: props.is_finished[1]
		},
		{
			title: "Approval",
			show: props.plan_success,
			is_loading: props.is_loading[2],
			is_finished: props.is_finished[2]
		},
		{
			title: "Deployment",
			show: props.sha_is_selected && props.can_deploy,
			is_loading: props.is_loading[3],
			is_finished: props.is_finished[3]
		}
	];
}


const DeployModal = React.createClass({

	componentDidMount: function() {
		window.addEventListener("resize", this.resize);
	},

	componentDidUpdate: function() {
		this.resize();
	},

	componentWillUnmount: function() {
		window.removeEventListener("resize", this.resize);
	},

	// calculate and set a pixel value on the modal height instead of a percentage
	// value so that we get a scrollbar inside the body of the modal
	resize: function() {
		// we need to remove the height of the modal header
		let headerHeight = 0;
		const headerElements = document.getElementsByClassName("modal-header");
		if (headerElements.length > 0) {
			headerHeight = headerElements[0].offsetHeight;
		}
		const bodyElements = document.getElementsByClassName("modal-body");
		if (bodyElements.length > 0) {
			bodyElements[0].style.height = (window.innerHeight - headerHeight) + 'px';
		}
	},

	render: function() {
		const steps = calculateSteps(this.props);

		return (
			<Modal show={this.props.is_open} className="deploy" closeHandler={this.props.onClose} title="Deployment">
				<div className="row">
					<div className="col-md-3 menu" data-spy="affix" id="modal-menu">
						<StepMenu
							steps={steps}
							value={this.props.active_step}
							onClick={this.props.onTabClick}
						/>
					</div>
					<div className="col-md-9 main">
						<div className="deploy-form">
							<Messages
								messages={this.props.messages}
							/>
							<div>
								<div className="section fetch">
									<div style={{float: "right"}}>
										<ButtonGitUpdate />
									</div>
									<div>Last synced x/x/xx <span className="small">less than x xxxx ago</span></div>
									<div><i>Ensure you have the most recent code before setting up your deployment</i></div>
								</div>
								<GitRefSelector />
								<DeployPlan />
								<Approval />
								<Deployment />
							</div>
						</div>
					</div>
				</div>
			</Modal>
		);
	}
});

const mapStateToProps = function(state, ownProps) {
	function deployPlanIsOk() {
		return state.plan.validation_code === 'success' || state.plan.validation_code === 'warning';
	}

	function isApproved() {
		return state.approval.approved || state.approval.bypassed;
	}

	let active_step = 0;
	if (window.location.hash) {
		active_step = parseInt(window.location.hash.substring(1), 10);
	}

	let currentState = 'new';
	if (typeof state.deployment.list[ownProps.params.id] !== 'undefined') {
		currentState = state.deployment.list[ownProps.params.id].state;
	}

	return {
		is_loading: [
			state.git.is_loading || state.git.is_updating,
			state.plan.is_loading,
			state.approval.is_loading,
			constants.isDeploying(currentState)
		],
		is_finished: [
			state.git.selected_ref !== "",
			deployPlanIsOk(),
			deployPlanIsOk() && isApproved(),
			constants.isDeployDone(currentState)
		],
		is_open: typeof (ownProps.params.id) !== 'undefined' && ownProps.params.id !== null,
		plan_success: deployPlanIsOk(),
		messages: state.messages,
		sha_is_selected: (state.git.selected_ref !== ""),
		can_deploy: isApproved(),
		state: state.deployment.state,
		active_step: active_step
	};
};

const mapDispatchToProps = function() {
	return {
		onClose: function() {
			actions.history.push('/');
		},
		onTabClick: function(active_step) {
			document.location.hash = active_step;
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(DeployModal);
