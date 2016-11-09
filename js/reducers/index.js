const Redux = require('redux');

const api = require('./api.js');
const deployment = require('./deployment.js');
const environment = require('./environment.js');
const git = require('./git.js');
const plan = require('./plan.js');
const user = require('./user.js');

const planApp = Redux.combineReducers({
	api,
	git,
	plan,
	deployment,
	environment,
	user
});

module.exports = planApp;
