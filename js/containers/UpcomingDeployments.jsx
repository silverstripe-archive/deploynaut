const React = require('react');
const ReactRedux = require('react-redux');

const _ = require('underscore');
const actions = require('../_actions.js');

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

	return (
		<div>
			<h4>Upcoming</h4>
			<table className="table table-striped table-hover">
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
							return (
								<tr onClick={() => props.onItemClick(row.id)} key={i}>
									<td>{row.date_requested}</td>
									<td>{row.commit_message}</td>
									<td>{row.deployer ? row.deployer.name : null}</td>
									<td>{row.approver ? row.approver.name : null}</td>
									<td>{row.state}</td>
								</tr>
							);
						})
					}
				</tbody>
			</table>
		</div>
	);
};

const mapStateToProps = function(state) {

	// try to find the current build in the list of all deployments
	let upcomingList = {};
	if (typeof state.deployment.list === "object") {
		upcomingList = _.filter(state.deployment.list, function(deploy) {
			switch (deploy.state) {
				case "Completed":
				case "Invalid":
				case "Failed":
					return false;
				default:
					return true;
			}
		});
	}
	upcomingList.sort(function(a, b) {
		return Date.parse(b.date_requested) - Date.parse(a.date_requested);
	});

	return {
		list: upcomingList,
		error: null
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
