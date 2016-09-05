var React = require("react");
var Redux = require('redux');
var ReactRedux = require('react-redux');

var thunkMiddleware = require('redux-thunk').default;
var createLogger = require('redux-logger');

var App = require('./containers/App.jsx');

var rootReducer = require("./reducers/index.js");
var webAPI = require('./_api.js');
var git = require('./actions/git.js');

var store = Redux.createStore(
	rootReducer,
	Redux.applyMiddleware(
		thunkMiddleware,
		createLogger()
	)
);

var Plan = function(props) {

	// first we setup the web api with CSRF tokens and backend dispatcher
	// end_points
	store.dispatch(webAPI.setupAPI(
		props.model.dispatchers,
		props.model.api_auth
	));

	store.dispatch(git.getRevisionsIfNeeded());

	return (
		<ReactRedux.Provider store={store}>
			<App />
		</ReactRedux.Provider>
	);
};

module.exports = Plan;
