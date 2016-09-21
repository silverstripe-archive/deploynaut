const Redux = require('redux');

const api = require('./api.js');
const approval = require('./approval.js');
const deployment = require('./deployment.js');
const environment = require('./environment.js');
const git = require('./git.js');
const messages = require('./messages.js');
const plan = require('./plan.js');

const planApp = Redux.combineReducers({
	api,
	git,
	plan,
	approval,
	deployment,
	messages,
	environment
});

module.exports = planApp;
