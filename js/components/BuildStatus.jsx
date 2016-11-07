const React = require('react');

var BuildStatus = function(props) {
	if (typeof props.deployment.short_sha === 'undefined') {
		return null;
	}

	let label = null;
	if (props.deployment.branch) {
		label = (
			<span>
				<span className="label label-default">{props.deployment.branch}</span>
				&nbsp;
			</span>
		);
	}

	let link = null;
	if (props.openDeployHandler) {
		link = (
			<a className="show_link pull-right" onClick={() => props.openDeployHandler(props.deployment.id)}>
				<i className="fa fa-info-circle"></i>
			</a>
		);
	}

	let classes = null;
	if (props.status_box) {
		classes = 'status-box default';
	}

	return (
		<div className={classes}>
			{link}
			{label}
			{props.deployment.title}<br />
			<small>{props.deployment.commit_message}</small>
		</div>
	);
};

module.exports = BuildStatus;
