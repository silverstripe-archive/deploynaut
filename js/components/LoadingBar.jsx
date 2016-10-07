const React = require('react');

const LoadingBar = function(props) {
	if (!props.show) {
		return null;
	}

	return (
		<div className="loading-horizontal">
			<div id="loading-horizontal-1"></div>
			<div id="loading-horizontal-2"></div>
			<div id="loading-horizontal-3"></div>
			<div id="loading-horizontal-4"></div>
			<div id="loading-horizontal-5"></div>
			<div id="loading-horizontal-6"></div>
			<div id="loading-horizontal-7"></div>
			<div id="loading-horizontal-8"></div>
		</div>
	);
};

module.exports = LoadingBar;
