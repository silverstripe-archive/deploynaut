const React = require('react');

const LoadingBar = function(props) {
	if (!props.show) {
		return null;
	}

	return (
		<div className="loading-bar">
			<div className="bounce1"></div>
			<div className="bounce2"></div>
			<div className="bounce3"></div>
		</div>
	);
};

module.exports = LoadingBar;
