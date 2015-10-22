var DeploymentDialog = require('./deployment_dialog.jsx');
var CreateProjectProgress = require('./create_project_progress.jsx');

// Mount the component only on the page where the holder is actually present.
var holder = document.getElementById('deployment-dialog-holder');
if (holder) {
	React.render(
		<DeploymentDialog context = {environmentConfigContext} />,
		holder
	);
}

var createProjectProgressHolder = document.getElementById('create-project-progress-holder');
if(createProjectProgressHolder) {
	React.render(
		<CreateProjectProgress statusUrl={createProjectStatusUrl}
	   		deployKey={deployKey}
			deployKeyTestUrl={deployKeyTestUrl}
			initalCanAccessRepo={canAccessRepo}	/>,
		createProjectProgressHolder
	);
}


