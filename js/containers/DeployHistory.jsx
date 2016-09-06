var React = require('react');
var ReactRedux = require('react-redux');
var Pagination = require('react-bootstrap/lib/Pagination');
var actions = require('../_actions.js');

var DeployHistory = function(props) {
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
					{
						Object.keys(props.list).map(function(i) {
							if(!props.list.hasOwnProperty(i)) {
								return;
							}

							var row = props.list[i];
							return (
								<tr key={i}>
									<td>{row.CreatedDate}</td>
									<td>{row.CommitMessage}</td>
									<td>{row.Approver}</td>
									<td>{row.Deployer}</td>
									<td>{row.State}</td>
								</tr>
							);
						})
					}
				</tbody>
			</table>
			<Pagination
				prev={props.currentpage > 1}
				next={props.currentpage !== props.totalpages}
				first={props.currentpage > 1}
				last={props.currentpage !== props.totalpages}
				items={props.totalpages}
				activePage={props.currentpage}
				onSelect={props.onPageClick}
			/>
		</div>
	);
};

const mapStateToProps = function(state) {
	return {
		list: state.deployhistory.list,
		pagelength: state.deployhistory.pagelength,
		totalpages: state.deployhistory.totalpages,
		currentpage: state.deployhistory.currentpage
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onPageClick: function(page) {
			dispatch(actions.getDeployHistory(page));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(DeployHistory);
