var React = require("react");
var SummaryTable = require('../SummaryTable.jsx');

var DeployDiff = function (props) {

	if(props.isLoading) {
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
	isLoading: React.PropTypes.bool
};

module.exports = DeployDiff;

