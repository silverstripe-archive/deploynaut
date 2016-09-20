var React = require('react');
var ReactRedux = require('react-redux');
var Pagination = require('react-bootstrap/lib/Pagination');
const _ = require('underscore');
var actions = require('../_actions.js');

var DeployHistory = function(props) {
	let errorRow = null;
	let pagination = null;

	if (props.error) {
		errorRow = (
			<tr className="danger">
				<td colSpan="5">
					{props.error}
				</td>
			</tr>
		);
	}

	if (props.total_pages > 1) {
		pagination = (
			<Pagination
				prev
				next
				items={props.total_pages}
				activePage={props.current_page}
				onSelect={props.onPageClick}
			/>
		);
	}

	return (
		<div>
			<h4>History</h4>
			<table className="table table-striped table-hover">
				<thead>
					<tr>
						<th>Deploy date</th>
						<th>Build details</th>
						<th>Approval</th>
						<th>Deployed by</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{errorRow}
					{
						Object.keys(props.list).map(function(i) {
							var row = props.list[i];
							return (
								<tr onClick={() => props.onItemClick(row.id)} key={i}>
									<td>{row.date_started}</td>
									<td>{row.commit_message}</td>
									<td>{row.approver ? row.approver.name : null}</td>
									<td>{row.deployer ? row.deployer.name : null}</td>
									<td>{row.state}</td>
								</tr>
							);
						})
					}
				</tbody>
			</table>
			{pagination}
		</div>
	);
};

const mapStateToProps = function(state) {

	// try to find the current build in the list of all deployments
	let historyList = {};
	if (typeof state.deployment.list === "object") {
		historyList = _.filter(state.deployment.list, function(deploy) {
			switch (deploy.state) {
				case "Completed":
				case "Invalid":
				case "Failed":
					return true;
				default:
					return false;
			}
		});
	}
	historyList.sort(function(a, b) {
		return Date.parse(b.date_started) - Date.parse(a.date_started);
	});

	return {
		list: historyList,
		page_length: state.deployment.pagination.page_length,
		total_pages: state.deployment.pagination.total_pages,
		current_page: state.deployment.pagination.current_page,
		error: state.deployment.error
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onItemClick: function(id) {
			dispatch(actions.getDeployment(id))
				.then(() => dispatch(actions.openPlanDialog()));
		},
		onPageClick: function(page) {
			dispatch(actions.getDeployHistory(page));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(DeployHistory);
