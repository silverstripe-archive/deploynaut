var React = require("react");
var SummaryTable = require('../SummaryTable.jsx');

var DeployDiff = function (props) {

	if (props.is_loading) {
		return (
			<div>
				Loading summary...
			</div>
		);
	}

	return (
		<SummaryTable {...props} />
	);
};

DeployDiff.propTypes = {
	is_loading: React.PropTypes.bool
};

module.exports = DeployDiff;
