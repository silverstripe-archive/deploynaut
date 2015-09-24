var DeploymentDialog = require('./deployment_dialog.jsx');

// Mount the component only on the page where the holder is actually present.
if (typeof document.getElementById('deployment-dialog-holder')!=='undefined') {
	React.render(
		<DeploymentDialog context = {environmentConfigContext} />,
		document.getElementById('deployment-dialog-holder')
	);
}
