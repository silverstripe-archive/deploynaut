var React = require('react');

var CurrentBuildStatus = require('./CurrentBuildStatus.jsx');
var NewDeployPlan = require('./buttons/NewDeployPlan.jsx');
var DeployModal = require('./DeployModal.jsx');
var UpcomingDeployments = require('./UpcomingDeployments.jsx');
var DeployHistory = require('./DeployHistory.jsx');

function App() {
	return (
		<div>
			<CurrentBuildStatus />
			<NewDeployPlan />
			<DeployModal />
			<UpcomingDeployments />
			<DeployHistory />
		</div>
	);
}

module.exports = App;
