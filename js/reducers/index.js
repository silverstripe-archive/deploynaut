var Redux = require('redux');

var api = require('./api.js');
var approval = require('./approval.js');
var deployment = require('./deployment.js');
var environment = require('./environment.js');
var git = require('./git.js');
var messages = require('./messages.js');
var navigation = require('./navigation.js');
var plan = require('./plan.js');

const planApp = Redux.combineReducers({
	api,
	git,
	plan,
	approval,
	deployment,
	messages,
	navigation,
	environment
});

module.exports = planApp;
