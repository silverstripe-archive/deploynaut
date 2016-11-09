const React = require('react');
const ReactRouter = require('react-router');

const CurrentBuildStatus = require('./CurrentBuildStatus.jsx');
const UpcomingDeployments = require('./UpcomingDeployments.jsx');
const DeployHistory = require('./DeployHistory.jsx');

function App(props) {
	return (
		<div>
			<CurrentBuildStatus />
			<div className="row">
				<div className="col-md-9">
				</div>
				<div className="col-md-3 text-right">
					<ReactRouter.Link className="btn btn-primary btn-lg-wide" to="/deployment/new">
						New deployment
					</ReactRouter.Link>
				</div>
			</div>
			<UpcomingDeployments />
			<DeployHistory />
			{props.children}
		</div>
	);
}

module.exports = App;
