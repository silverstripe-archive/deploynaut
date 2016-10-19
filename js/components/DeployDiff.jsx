var React = require("react");
var SummaryTable = require('../SummaryTable.jsx');

var DeployDiff = function (props) {

	// filter out things that haven't changed
	const filteredProps = {
		changes: {}
	};
	Object.keys(props.changes).forEach(function(key) {
		if (props.changes[key].to === props.changes[key].from) {
			return;
		}
		filteredProps.changes[key] = props.changes[key];
	});

	if (props.is_loading) {
		return (
			<div>
				Loading summary...
			</div>
		);
	}

	return (
		<div className="fade-in">
			<SummaryTable {...filteredProps} />
		</div>
	);
};

DeployDiff.propTypes = {
	is_loading: React.PropTypes.bool
};

module.exports = DeployDiff;
