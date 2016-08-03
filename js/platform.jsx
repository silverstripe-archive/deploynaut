/* global environmentConfigContext */

var React = require("react");
var ReactDOM = require("react-dom");

var DeploymentDialog = require('./DeploymentDialog.jsx');

// Mount the component only on the page where the holder is actually present.
var holder = document.getElementById('deployment-dialog-holder');
if (holder) {
	ReactDOM.render(
		<DeploymentDialog context={environmentConfigContext} />,
		holder
	);
}
