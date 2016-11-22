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
			<a href={"javascript:void(0);"} className="pull-right" onClick={() => props.openDeployHandler(props.deployment.id)}>
				<i className="fa fa-lg fa-info-circle"></i>
			</a>
		);
	}

	let classes = null;
	if (props.status_box) {
		classes = 'status-box default';
	}

	let secondaryLine = null;
	if (props.status_ago) {
		secondaryLine = props.deployment.date_created_ago;
	} else {
		secondaryLine = props.deployment.commit_subject;
	}

	return (
		<div className={classes}>
			{link}
			<a
				className="sha-detail"
				href={props.deployment.commit_url}
				title={props.deployment.sha}
			>
				{props.deployment.short_sha}
			</a>&nbsp;
			{label}
			{props.deployment.title}<br />
			<small>{secondaryLine}</small>
		</div>
	);
};

module.exports = BuildStatus;
