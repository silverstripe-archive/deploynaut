var React = require('react');
var ReactRedux = require('react-redux');
var actions = require('../_actions.js');

var UpcomingDeployments = function(props) {
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
							var row = props.list[i];
							return (
								<tr onClick={() => props.onItemClick(row.id)} key={i}>
									<td>{row.created}</td>
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
	return {
		list: state.upcomingdeployments.list,
		error: state.upcomingdeployments.error
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onItemClick: function(id) {
			dispatch(actions.getDeployment(id))
				.then(() => dispatch(actions.openPlanDialog()));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(UpcomingDeployments);
