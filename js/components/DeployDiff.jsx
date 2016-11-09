const React = require("react");
const SummaryTable = require('../SummaryTable.jsx');

const DeployDiff = function(props) {

	// filter out things that haven't changed
	const filteredProps = {
		changes: {}
	};
	Object.keys(props.changes).forEach(function(key) {
		if (props.changes[key].to === props.changes[key].from && !props.changes[key].description) {
			return;
		}
		filteredProps.changes[key] = props.changes[key];
	});

	return (
		<div className="fade-in">
			<SummaryTable {...filteredProps} />
		</div>
	);
};

module.exports = DeployDiff;
