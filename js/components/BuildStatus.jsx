var React = require('react');

var BuildStatus = function(props) {
	var classNames = 'build-details';
	if (props.status_box) {
		classNames += ' build-status';
	}

	return (
		<div className={classNames}>
			<a className="sha-detail" href={props.deployment.commit_url} title={props.deployment.sha}>{props.deployment.short_sha}</a>
			<span className="deployment-branch">{props.deployment.branch}</span>
			<span className="deployed-detail">{props.deployment.commit_message}</span>
		</div>
	);
};

module.exports = BuildStatus;
