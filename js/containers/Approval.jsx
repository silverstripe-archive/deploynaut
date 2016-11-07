var React = require("react");
var ReactRedux = require('react-redux');

var Dropdown = require('../components/Dropdown.jsx');
var RequestApproval = require('./buttons/RequestApproval.jsx');
var Bypass = require('./buttons/Bypass.jsx');

var actions = require('../_actions.js');

function Approval(props) {
	var sentTime = null;
	if (props.date_requested_nice) {
		sentTime = "Sent: " + props.date_requested_nice;
	}

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

	let loading = null;
	if (props.is_loading) {
		loading = (
			<div>
				Loading...
			</div>
		);
	}

	return (
		<div className="section">
			<header id="2">Approval</header>
			<p>
				Once this request has been approved, your team will be able to
				progress to the final Deployment step.
			</p>

			<div className="form-group">
				<label htmlFor="approver">Request approval from</label>
				<Dropdown
					name="approver"
					options={props.approvers}
					value={props.approver_id}
					onSelect={props.onApproverSelect}
					disabled={props.disabled}
				/>
				<small>
					Only one request can be active at a time, approval can also
					be granted by others with the same access level, e.g. Release
					manager.
				</small>
			</div>
			{loading}
			<div>
				{sentTime}
			</div>
			<div>
				<RequestApproval /> <Bypass />
			</div>
			{error}
		</div>
	);
}

function isDisabled(state) {
	if (state.deployment.approved) {
		return true;
	}
	if (state.deployment.queued) {
		return true;
	}
	return false;
}

const mapStateToProps = function(state) {
	const approvers = state.deployment.approvers.map(function(val) {
		return {
			id: val.id,
			title: val.email + " - " + val.role
		};
	});

	return {
		disabled: isDisabled(state),
		date_requested_nice: state.deployment.data.date_requested_nice,
		approvers: approvers,
		approver_id: state.deployment.approver_id,
		error: state.deployment.error,
		is_loading: state.deployment.is_loading
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onApproverSelect: function(id) {
			dispatch(actions.setApprover(id));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Approval);
