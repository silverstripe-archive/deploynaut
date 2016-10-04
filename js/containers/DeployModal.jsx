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
			title: "Target Release",
			show: true,
			is_loading: props.is_loading[0],
			is_finished: props.is_finished[0]
		},
		{
			title: "Deployment Plan",
			show: true,
			is_loading: props.is_loading[1],
			is_finished: props.is_finished[1]
		},
		{
			title: "Approval",
			show: true,
			is_loading: props.is_loading[2],
			is_finished: props.is_finished[2]
		},
		{
			title: "Deployment",
			show: true,
			is_loading: props.is_loading[3],
			is_finished: props.is_finished[3]
		}
	];
}


const DeployModal = React.createClass({

	bodyElement: null,

	componentDidMount: function() {
		window.addEventListener("resize", this.resize);
		const bodyElements = document.getElementsByClassName("modal-body");
		if (bodyElements.length === 0) {
			return;
		}

		this.bodyElement = bodyElements[0];
		this.bodyElement.addEventListener("scroll", this.calculateActiveSection);

		this.resize();
		this.calculateActiveSection();
	},

	componentDidUpdate: function() {
		this.resize();
		this.calculateActiveSection();
	},

	componentWillUnmount: function() {
		window.removeEventListener("resize", this.resize);
		if(this.bodyElement) {
			this.bodyElement.removeEventListener("scroll", this.calculateActiveSection);
		}
	},

	calculateActiveSection: function() {
		// menu items
		const menuItems = $('.menu').find("li");
		// section anchors corresponding to menu items
		const scrollItems = menuItems.map(function() {
			const item = $($(this).attr("href"));
			if (item.length) { return item; }
		});

		// this is a carefully hand tweaked value (:P) that will ensure that when a section
		// is reasonable in view it will mark the menu as active
		const topOffset = 230;

		// find all items that are above the topOffset
		let cur = scrollItems.map(function(){
			if ($(this).offset().top < topOffset) {
				return this;
			}
		});
		// we take the last item in the list above and mark it as action
		if (cur && cur.length) {
			$(menuItems[cur.length-1]).addClass("active");
			$(menuItems[cur.length-1]).siblings().removeClass("active");
		}
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
		let bodyHeight = 0;
		if (bodyElements.length > 0) {
			bodyHeight = (window.innerHeight - headerHeight);
		}

		if(bodyHeight === 0) {
			return;
		}

		// set the height of the modal
		bodyElements[0].style.height = bodyHeight + 'px';
		// scale each "step" section to be the same height as the modal window
		const sections = this.bodyElement.getElementsByClassName("section");

		const lastSection = sections[sections.length-1];
		if (lastSection) {
			const sectionHeight = sections[sections.length-1].offsetHeight;
			// calculate the required margin to pad the section so that it can be
			// properly scrolled to the top
			const sectionMargin = bodyHeight - sectionHeight;
			if (sectionMargin > 0) {
				lastSection.style.marginBottom = sectionMargin + 'px';
			}
		}
	},

	render: function() {
		const steps = calculateSteps(this.props);

		return (
			<Modal show={this.props.is_open} className="deploy" closeHandler={this.props.onClose} title="Deployment">
				<div className="row">
					<div className="col-md-3 menu affix">
						<StepMenu
							steps={steps}
							value={this.props.active_step}
							onClick={this.props.onTabClick}
						/>
					</div>
					<div className="col-md-9 main" >
						<div className="deploy-form">
							<Messages
								messages={this.props.messages}
							/>
							<div>
								<div className="fetch">
									<div style={{float: "right"}}>
										<ButtonGitUpdate />
									</div>
									<div>Last synced x/x/xx <span className="small">less than x xxxx ago</span></div>
									<div><i>Ensure you have the most recent code before setting up your deployment</i></div>
								</div>
								<GitRefSelector  />
								<DeployPlan  />
								<Approval  />
								<Deployment  />
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
			state.deployment.is_loading,
			constants.isDeploying(currentState)
		],
		is_finished: [
			state.git.selected_ref !== "",
			deployPlanIsOk(),
			deployPlanIsOk() && state.deployment.approved,
			constants.isDeployDone(currentState)
		],
		is_open: typeof (ownProps.params.id) !== 'undefined' && ownProps.params.id !== null,
		plan_success: deployPlanIsOk(),
		messages: state.messages,
		sha_is_selected: (state.git.selected_ref !== ""),
		can_deploy: state.deployment.approved,
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
