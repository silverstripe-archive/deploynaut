var React = require('react');
var ReactRedux = require('react-redux');
var Pagination = require('react-bootstrap/lib/Pagination');
var actions = require('../_actions.js');

var DeployHistory = function(props) {

	let errorRow = null;
	if(props.error) {
		errorRow = (
			<tr className="danger">
				<td colSpan="5">
					{props.error}
				</td>
			</tr>
		);
	}

	let pagination = null;
	if(props.totalpages > 1) {
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
						<th>Request date</th>
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
									<td>{row.created}</td>
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
	return {
		list: state.deployhistory.list,
		page_length: state.deployhistory.page_length,
		total_pages: state.deployhistory.total_pages,
		current_page: state.deployhistory.current_page,
		error: state.deployhistory.error
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onItemClick: function(id) {
			dispatch(actions.getDeployment(id))
				.then(dispatch(actions.openPlanDialog()));
		},
		onPageClick: function(page) {
			dispatch(actions.getDeployHistory(page));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(DeployHistory);
