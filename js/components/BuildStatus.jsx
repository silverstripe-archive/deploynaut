var React = require('react');

var BuildStatus = function(props) {
	var shortSha = "";
	if (typeof props.deployment.sha === 'string') {
		shortSha = props.deployment.sha.substring(0, 7);
	}

	return (
		<div className="build-status">
			<div className="build-details">
				<a className="branch-detail" href={props.deployment.commit_url}>{props.deployment.branch}
					<span className="sha-detail" title={props.deployment.sha}>{shortSha}</span>
				</a>
				<span className="message-detail">{props.deployment.commit_message}</span>
				<span className="deployed-detail">{props.deployment.deployed}</span>
			</div>
		</div>
	);
};

module.exports = BuildStatus;
