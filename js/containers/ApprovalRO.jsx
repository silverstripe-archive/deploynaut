var React = require("react");
var ReactRedux = require('react-redux');

var Dropdown = require('../components/Dropdown.jsx');
var RequestApproval = require('./buttons/RequestApproval.jsx');
var CancelApprovalRequest = require('./buttons/CancelApprovalRequest.jsx');
var ApproveRequest = require('./buttons/ApproveRequest.jsx');
var RejectRequest = require('./buttons/RejectRequest.jsx');
var Bypass = require('./buttons/Bypass.jsx');
var StatusBox = require('../components/StatusBox.jsx');

var actions = require('../_actions.js');
var constants = require('../constants/deployment.js');

function getStateTitle(approvalState) {
	switch (approvalState) {
		case constants.APPROVAL_SUBMITTED:
			return 'Pending review by:';
		case constants.APPROVAL_REJECTED:
			return 'Rejected by:';
		case constants.APPROVAL_APPROVED:
			return 'Approved by:';
		case constants.APPROVAL_BYPASSED:
			return 'Approval has been bypassed'
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

function Approval(props) {
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

	let stateTitle = getStateTitle(props.approval_state);
	let approver_name = props.approver ? props.approver.name : '';

	let date = '';
	if (props.date_approved_nice) {
		date = props.date_approved_nice;
	} else if (props.date_requested_nice) {
		date = props.date_requested_nice;
	}

	let action = null;
	if (props.approval_state === constants.APPROVAL_SUBMITTED) {
		action = (
			<a className="approval-action" onClick={props.onCancel}>
				<i className="fa fa-times-circle"></i> Remove
			</a>
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
					{action}
					<div className={"state " + props.approval_state}>
						{stateTitle}
					</div>
				</div>
				<div>{approver_name} <small>{date}</small></div>
			</StatusBox>
			<div>
				<ApproveRequest /> <RejectRequest />
			</div>
			<div>
				<Bypass />
			</div>
			{error}
		</div>
	);
}

const mapStateToProps = function(state) {
	let approver = state.deployment.approvers.find(function(val) {
		if (val.id === state.deployment.approver_id) {
			return val;
		}
	});

	return {
		approval_state: constants.getApprovalState(state.deployment.state),
		date_requested_nice: state.deployment.data.date_requested_nice,
		date_approved_nice: state.deployment.data.date_approved_nice,
		approver: approver,
		error: state.deployment.error,
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
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Approval);
