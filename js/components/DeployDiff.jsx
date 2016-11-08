const React = require("react");
const SummaryTable = require('../SummaryTable.jsx');
const LoadingBar = require('../components/LoadingBar.jsx');

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
			<LoadingBar show={props.is_loading} />
			<SummaryTable {...filteredProps} />
		</div>
	);
};

DeployDiff.propTypes = {
	is_loading: React.PropTypes.bool
};

module.exports = DeployDiff;
