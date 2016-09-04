var React = require('react');
var ReactRedux = require('react-redux');
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
						Object.keys(props.data).map(function(i) {
							if(!props.data.hasOwnProperty(i)) {
								return;
							}

							var row = props.data[i];
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
		</div>
	);
};

const mapStateToProps = function(state) {
	return {
		data: state.deployhistory.data
	};
};

const mapDispatchToProps = function(dispatch) {
	return {};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(DeployHistory);
