const React = require('react');
const ReactRedux = require('react-redux');
const BuildStatus = require('../components/BuildStatus.jsx');

const _ = require('underscore');
const actions = require('../_actions.js');
const deployStates = require('../constants/deployment.js');

const UpcomingDeployments = function(props) {
	let errorRow = null;

	if (props.error) {
		errorRow = (
			<tr className="danger">
				<td colSpan="5">
					{props.error}
				</td>
			</tr>
		);
	}

	if (props.list.length === 0 && errorRow === null) {
		return null;
	}

	return (
		<div className="fade-in">
			<h4>Upcoming</h4>
			<div className="table-responsive">
				<table className="table table-clickable table-centered-columns table-striped table-hover">
					<thead>
						<tr>
							<th>Request date</th>
							<th>Build details</th>
							<th>Requested by</th>
							<th>Approval</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{errorRow}
						{
							Object.keys(props.list).map(function(i) {
								const row = props.list[i];

								let approver = null;
								let deployer = null;
								if (row.deployer) {
									deployer = row.deployer.name;
								}
								if (row.approver && (deployStates.isApproved(row.state) || deployStates.isRejected(row.state))) {
									approver = row.approver.name;
								} else if (deployStates.isApproved(row.state)) {
									approver = (
										<span className="bypassed">Bypassed</span>
									);
								}

								return (
									<tr className={"fade-in status-" + row.state} onClick={() => props.onItemClick(row.id)} key={i}>
										<td>{row.date_requested_nice ? row.date_requested_nice : "-"}</td>
										<td><BuildStatus deployment={row} /></td>
										<td>{deployer}</td>
										<td className="deploy-approver">{approver}</td>
										<td className="deploy-status"><span className="deploy-status-text">{row.state}</span></td>
									</tr>
								);
							})
						}
					</tbody>
				</table>
			</div>
		</div>
	);
};

const mapStateToProps = function(state) {

	// try to find the current build in the list of all deployments
	let upcomingList = [];
	if (typeof state.deployment.list === "object") {
		upcomingList = _.filter(state.deployment.list, function(deploy) {
			switch (deploy.state) {
				case undefined:
				case deployStates.STATE_COMPLETED:
				case deployStates.STATE_INVALID:
				case deployStates.STATE_FAILED:
					return false;
				default:
					return true;
			}
		});
	}
	upcomingList.sort(function(a, b) {
		return Date.parse(b.date_created) - Date.parse(a.date_created);
	});

	return {
		list: upcomingList
	};
};

const mapDispatchToProps = function() {
	return {
		onItemClick: function(id) {
			actions.history.push('/deployment/' + id.toString());
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(UpcomingDeployments);
