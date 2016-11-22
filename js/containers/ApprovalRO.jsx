const React = require("react");
const ReactRedux = require('react-redux');

const TextArea = require('../components/TextArea.jsx');
const ApproveRequest = require('./buttons/ApproveRequest.jsx');
const RejectRequest = require('./buttons/RejectRequest.jsx');
const Bypass = require('./buttons/Bypass.jsx');
const StatusBox = require('../components/StatusBox.jsx');
const LoadingBar = require('../components/LoadingBar.jsx');

const actions = require('../_actions.js');
const constants = require('../constants/deployment.js');

function getStateTitle(approvalState) {
	switch (approvalState) {
		case constants.APPROVAL_SUBMITTED:
			return 'Pending review by:';
		case constants.APPROVAL_REJECTED:
			return 'Rejected by:';
		case constants.APPROVAL_APPROVED:
			return 'Approved by:';
		case constants.APPROVAL_BYPASSED:
			return 'Approval has been bypassed';
		default:
			return '';
	}
}

function getStateDescription(approvalState) {
	switch (approvalState) {
		case constants.APPROVAL_SUBMITTED:
			return 'Send a request to deploy this release, once approved team members will have the ability to deploy this release. Only one request for approval can be sent at a time, although approval can also be granted by others with the same permission.';
		case constants.APPROVAL_REJECTED:
			return 'This deployment has been rejected.';
		case constants.APPROVAL_BYPASSED:
		case constants.APPROVAL_APPROVED:
			return 'Once approved team members will have the ability to deploy this release. Only one request for approval can be sent at a time, although approval can also be granted by others with the same permissions. e.g. Release managers.';
		default:
			return '';
	}
}

const ApprovalRO = React.createClass({

	getInitialState: function() {
		return {
			rejected_reason_open: this.props.approval_state === constants.APPROVAL_REJECTED
		};
	},

	getRemoveAction: function() {
		if (this.state.rejected_reason_open) {
			return null;
		}
		let extraClasses = "";
		if (this.props.approval_is_loading) {
			extraClasses = ' disabled';
		}
		const icon = this.props.approval_cancel_is_loading ? "fa fa-refresh fa-spin" : "fa fa-times-circle";
		const text = this.props.approval_cancel_is_loading ? 'Removing' : 'Remove';


		return (
			<a
				href={"javascript:void(0);"}
				className={"approval-action btn btn-link pull-right" + extraClasses}
				onClick={this.props.onCancel}
			>
				<i className={icon}></i>{text}
			</a>
		);
	},

	getRejectShowReasonAction: function() {
		return (
			<a href={"javascript:void(0);"} className="btn btn-wide btn-link" onClick={this.toggleRejectOpen}>
				Reject
			</a>
		);
	},

	getRejectHideReasonAction: function() {
		let extraClasses = "";
		// disabled mode, some other approval action is currently loading
		if (this.props.approval_is_loading) {
			extraClasses = ' disabled';
		}
		return (
			<a href={"javascript:void(0);"} className={"btn btn-wide btn-link" + extraClasses} onClick={this.toggleRejectOpen}>
				Cancel
			</a>
		);
	},

	toggleRejectOpen: function() {
		this.setState({
			rejected_reason_open: !this.state.rejected_reason_open
		});
	},

	render: function() {
		const props = this.props;

		let error = null;
		if (props.error) {
			error = (
				<div className="alert alert-danger">
					<div className="">
						{props.error}
					</div>
				</div>
			);
		}

		const stateTitle = getStateTitle(props.approval_state);
		const approver_name = props.approver ? props.approver.name : '';
		const approver_role = props.approver ? props.approver.role : '';

		let date = '';
		if (props.date_approved_nice) {
			date = props.date_approved_nice;
		} else if (props.date_requested_nice) {
			date = props.date_requested_nice;
		}

		let removeAction = null;
		let rejectAction = null;
		let rejectCancel = null;
		if (props.can_approve && props.approval_state === constants.APPROVAL_SUBMITTED) {
			removeAction = this.getRemoveAction();
			rejectAction = this.getRejectShowReasonAction();
			rejectCancel = this.getRejectHideReasonAction();
		}

		let mainActions = null;
		// if the reject input isn't triggered we show these actions
		if (!this.state.rejected_reason_open) {
			mainActions = (
				<div>
					<ApproveRequest /> {rejectAction}
				</div>
			);
		}

		return (
			<div className="section approval">
				<header id="2">Approval</header>
				<p>
					{getStateDescription(props.approval_state)}
				</p>
				<StatusBox type={props.approval_state}>
					<div>
						{removeAction}
						<div className={"state " + props.approval_state}>
							{stateTitle}
						</div>
					</div>
					<div>{approver_name} <small className="text-uppercase">{approver_role}</small> <small>{date}</small></div>
				</StatusBox>
				<LoadingBar show={props.is_loading} />
				{mainActions}
				<div className={this.state.rejected_reason_open ? "" : "hide"}>
					<label htmlFor="rejected_reason">Provide a reason why the deployment has been rejected</label>
					<TextArea
						id="rejected_reason"
						value={props.rejected_reason}
						rows="5"
						onChange={props.onRejectReasonChange}
						disabled={props.approval_state === constants.APPROVAL_REJECTED}
					/>
					<RejectRequest />
					{rejectCancel}
				</div>
				<div>
					<Bypass />
				</div>
				{error}
			</div>
		);
	}

});

const mapStateToProps = function(state) {
	const current = state.deployment.list[state.deployment.current_id] || {};
	const approver = state.environment.approvers[current.approver_id];

	return {
		approval_state: constants.getApprovalState(current.state, approver),
		approval_is_loading: state.approval.is_loading,
		approval_cancel_is_loading: state.approval.cancel_is_loading,
		date_requested_nice: current.date_requested_nice,
		date_approved_nice: current.date_approved_nice,
		approver: approver,
		can_approve: state.user.can_approve,
		rejected_reason: current.rejected_reason,
		error: state.approval.error,
		is_loading: state.deployment.is_loading
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onApproverSelect: function(id) {
			dispatch(actions.setApprover(id));
		},
		onCancel: function() {
			dispatch(actions.cancelApprovalRequest());
		},
		onRejectReasonChange: function(e) {
			dispatch(actions.setRejectReason(e.target.value));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(ApprovalRO);
