const Redux = require('redux');

const api = require('./api.js');
const approval = require('./approval.js');
const deployment = require('./deployment.js');
const deployhistory = require('./deployhistory.js');
const upcomingdeployments = require('./upcomingdeployments.js');
const currentbuild = require('./currentbuild.js');
const environment = require('./environment.js');
const git = require('./git.js');
const messages = require('./messages.js');
const navigation = require('./navigation.js');
const plan = require('./plan.js');

const planApp = Redux.combineReducers({
	api,
	git,
	plan,
	approval,
	deployment,
	deployhistory,
	currentbuild,
	upcomingdeployments,
	messages,
	navigation,
	environment
});

module.exports = planApp;
