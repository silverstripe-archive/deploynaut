const React = require('react');
const ReactRedux = require('react-redux');

const StepMenu = require('../components/StepMenu.jsx');
const TargetRelease = require('./TargetRelease.jsx');
const TargetReleaseRO = require('./TargetReleaseRO.jsx');

const Approval = require('./Approval.jsx');
const ApprovalRO = require('./ApprovalRO.jsx');
const Deployment = require('./Deployment.jsx');
const DeployPlan = require('./DeployPlan.jsx');
const DeployPlanRO = require('./DeployPlanRO.jsx');
const Modal = require('../Modal.jsx');
const LoadingBar = require('../components/LoadingBar.jsx');

const actions = require('../_actions.js');
const constants = require('../constants/deployment.js');

function calculateSteps(props) {
	return [
		{
			title: "Target release",
			show: props.show[0],
			is_finished: props.is_finished[0]
		},
		{
			title: "Deployment plan",
			show: props.show[1],
			is_finished: props.is_finished[1]
		},
		{
			title: "Approval",
			show: props.show[2],
			is_finished: props.is_finished[2]
		},
		{
			title: "Deployment",
			show: props.show[3],
			is_finished: props.is_finished[3]
		}
	];
}


const DeployModal = React.createClass({

	componentDidMount: function() {
		window.addEventListener("resize", this.resize);
		const bodyElements = document.getElementsByClassName("modal-body");
		if (bodyElements.length === 0) {
			return;
		}

		this.resize();
	},

	componentWillUpdate: function() {
		// Before we update, we save the current scroll "position" for use in componentDidUpdate
		this.saveScrollPosition();
	},

	componentDidUpdate: function(prevProps) {
		this.resize();
		// when the layout changes from write to readonly we ensure that the modal is scrolled to the same position
		// relative to the bottom to prevent a jarring jump. This happens when sending for approval or bypassing the
		// approval step.
		if (prevProps.can_edit !== this.props.can_edit) {
			this.resumeScrollPosition();
		}
	},

	componentWillUnmount: function() {
		window.removeEventListener("resize", this.resize);
	},

	bodyElement: null,

	// calculate and set a pixel value on the modal height instead of a percentage
	// value so that we get a scrollbar inside the body of the modal
	resize: function() {
		// We need to calculate the height of the ".modal .body" in the browsers window
		let headerHeight = 0;
		const headerElements = document.getElementsByClassName("modal-header");
		if (headerElements.length > 0) {
			headerHeight = headerElements[0].offsetHeight;
		}
		const bodyElements = document.getElementsByClassName("modal-body");
		let bodyHeight = 0;
		if (bodyElements.length > 0) {
			// leave 16px of space to the bottom of the window
			bodyHeight = (window.innerHeight - headerHeight) - 16;
		}

		if (bodyHeight === 0) {
			return;
		}

		// Increase the height of the modal, this cannot be done reliable in CSS because
		// a pixel value is required to use the "sticky" side bar
		bodyElements[0].style.height = bodyHeight + 'px';
		// give some space at the bottom so user can scroll
		bodyElements[0].style.paddingBottom = (bodyHeight / 10) + 'px';
	},

	scrollHeight: 0,

	scrollTop: 0,

	// save the current scroll position
	saveScrollPosition() {
		const node = document.getElementsByClassName("modal-body");
		if (node.length > 0) {
			this.scrollHeight = node[0].scrollHeight;
			this.scrollTop = node[0].scrollTop;
		}
	},

	// scroll the modal window body to the position previously saved in saveScrollPosition() relative
	// to the bottom. This will prevent the content jumping if content above the current scroll position
	// changes height.
	resumeScrollPosition() {
		const node = document.getElementsByClassName("modal-body");
		if (node.length > 0) {
			node[0].scrollTop = this.scrollTop + (node[0].scrollHeight - this.scrollHeight);
		}
	},

	render: function() {
		const steps = calculateSteps(this.props);
		const content = [];

		content[0] = (
			<div key={0} className="section">
				<LoadingBar show />
			</div>
		);

		if (steps[0].show) {
			if (this.props.can_edit) {
				content[0] = (<TargetRelease key={0} />);
			} else {
				content[0] = (<TargetReleaseRO key={0} />);
			}
		}
		if (steps[1].show) {
			if (this.props.can_edit) {
				content[1] = (<DeployPlan key={1} />);
			} else {
				content[1] = (<DeployPlanRO key={1} />);
			}
		}
		if (steps[2].show) {
			if (this.props.can_edit) {
				content[2] = (<Approval key={2} />);
			} else {
				content[2] = (<ApprovalRO key={2} />);
			}
		}
		if (steps[3].show) {
			content[3] = (<Deployment key={3} />);
		}

		const options = [];
		if (this.props.deployment_id && constants.canDelete(this.props.state)) {
			options.push({
				title: 'Delete',
				icon: 'fa fa-trash',
				handler: this.props.onDelete
			});
		}

		return (
			<Modal
				show={this.props.is_open}
				className="deploy"
				closeHandler={this.props.onClose}
				title={"Deploy to " + this.props.project_name + ' / ' + this.props.environment_name}
				closeTitle="Close"
				options={options}
			>
				<div className="row">
					<div className="col-md-3 menu affix">
						<StepMenu
							steps={steps}
							onClick={this.props.onStepClick}
						/>
					</div>
					<div className="col-md-9 main" >
						<div className="deploy-form">
							<div>
								{content}
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

	const current = state.deployment.list[state.deployment.current_id] || {};

	const showPlan = state.git.selected_ref !== "" && (typeof state.plan.changes === "object");
	const showApproval = state.deployment.current_id !== "" && current.dirty === false;

	return {
		show: [
			(!state.git.is_loading && !state.deployment.is_loading),
			showPlan,
			showPlan && showApproval,
			constants.isApproved(current.state)
		],
		is_finished: [
			state.git.selected_ref !== "",
			state.deployment.current_id !== "",
			deployPlanIsOk() && constants.isApproved(current.state),
			constants.isDeployDone(current.state)
		],
		can_edit: constants.canEdit(state),
		is_open: typeof (ownProps.params.id) !== 'undefined' && ownProps.params.id !== null,
		plan_success: deployPlanIsOk(),
		sha_is_selected: (state.git.selected_ref !== ""),
		can_deploy: (current.state === constants.STATE_APPROVED),
		state: current.state,
		environment_name: state.environment.name,
		project_name: state.environment.project_name,
		deployment_id: state.deployment.current_id
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onClose: function() {
			actions.history.push('/');
		},
		onDelete: function() {
			dispatch(actions.deleteDeployment())
				.then(() => actions.history.push('/'));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(DeployModal);
