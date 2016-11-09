const React = require("react");
const ReactRedux = require('react-redux');

const Dropdown = require('../components/Dropdown.jsx');
const RequestApproval = require('./buttons/RequestApproval.jsx');
const Bypass = require('./buttons/Bypass.jsx');
const LoadingBar = require('../components/LoadingBar.jsx');

const actions = require('../_actions.js');

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

	return (
		<div className="section">
			<header id="2">Approval</header>
			<p>
				Send a request to deploy this release. Once approved, team members will have the ability to deploy this release.<br />
				Only one request can be active at a time, although approval can also be granted by others with the same permissions, e.g. Release managers.
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
			</div>
			<LoadingBar show={props.is_loading} />
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
	if (state.deployment.rejected) {
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
