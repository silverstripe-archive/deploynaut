const React = require('react');
const ReactRouter = require('react-router');

const CurrentBuildStatus = require('./CurrentBuildStatus.jsx');
const UpcomingDeployments = require('./UpcomingDeployments.jsx');
const DeployHistory = require('./DeployHistory.jsx');

function App(props) {
	return (
		<div>
			<CurrentBuildStatus />
			<ReactRouter.Link className="btn btn-primary" to="/deployment/new">
				New deployment
			</ReactRouter.Link>
			<UpcomingDeployments />
			<DeployHistory />
			{props.children}
		</div>
	);
}

module.exports = App;
