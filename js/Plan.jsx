var React = require("react");
var Redux = require('redux');
var ReactRedux = require('react-redux');

var thunkMiddleware = require('redux-thunk').default;
var createLogger = require('redux-logger');

var App = require('./containers/App.jsx');

var rootReducer = require("./reducers/index.js");
var webAPI = require('./_api.js');
var actions = require('./_actions.js');

var store = Redux.createStore(
	rootReducer,
	Redux.applyMiddleware(
		thunkMiddleware,
		createLogger()
	)
);

var Plan = function(props) {
	store.dispatch(webAPI.setAPI(
		props.model.namespace,
		props.model.api_endpoint,
		props.model.api_auth
	));

	store.dispatch(actions.getRevisionsIfNeeded());

	return (
		<ReactRedux.Provider store={store}>
			<App />
		</ReactRedux.Provider>
	);
};

module.exports = Plan;
