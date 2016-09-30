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
					<p>New deployments can be taken through an approval process to ensure the correct
					code is being released. For a detailed description of the <a href="#">permissions</a> and <a href="#">deployment process</a> please
					refer to the <a href="#">deployment documentation</a>.</p>
				</div>
				<div className="col-md-3 text-right">
					<ReactRouter.Link className="btn btn-primary deploy-button" to="/deployment/new">
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
