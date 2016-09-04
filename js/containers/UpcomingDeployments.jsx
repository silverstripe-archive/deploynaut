var React = require('react');
var ReactRedux = require('react-redux');

var UpcomingDeployments = function(props) {
	var tableRows = null;

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
				{tableRows}
			</table>
		</div>
	);
};

const mapStateToProps = function(state) {
	return {
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(UpcomingDeployments);
