const React = require('react');
const Redux = require('redux');
const ReactRedux = require('react-redux');
const ReactRouter = require('react-router');
const thunkMiddleware = require('redux-thunk').default;
const createLogger = require('redux-logger');

const App = require('./containers/App.jsx');
const DeployModal = require('./containers/DeployModal.jsx');

const reducers = require('./reducers/index.js');
const webAPI = require('./_api.js');
const actions = require('./_actions.js');

const createHistory = require('history').createHistory;
const useRouterHistory = require('react-router').useRouterHistory;

const store = Redux.createStore(
	reducers,
	Redux.applyMiddleware(
		thunkMiddleware,
		createLogger()
	)
);

/**
 * Load deployment data, which is used by ReactRouter onEnter
 * as there is no direction connection between the store, and the URL
 * parameters provided by ReactRouter.
 */
function loadDeployment() {
	return (nextState) => {
		if (nextState.params.id === 'new') {
			store.dispatch(actions.newDeployment());
		} else if (nextState.params.id) {
			store.dispatch(actions.getDeployment(nextState.params.id));
		}
	};
}

function Plan(props) {
	// first we setup the web api with CSRF tokens and backend dispatcher endpoints
	store.dispatch(webAPI.setupAPI(
		props.model.dispatchers,
		props.model.api_auth
	));

	actions.history = useRouterHistory(createHistory)({ basename: props.model.basename });

	store.dispatch(actions.setEnvironment(props.model.environment));
	store.dispatch(actions.setUser(props.model.user));

	store.dispatch(actions.getUpcomingDeployments());
	store.dispatch(actions.getDeployHistory());
	store.dispatch(actions.getRevisionsIfNeeded());
	store.dispatch(actions.getApprovers());

	return (
		<ReactRedux.Provider store={store}>
			<ReactRouter.Router history={actions.history}>
				<ReactRouter.Route path="/" component={App}>
					<ReactRouter.Route path="deployment/:id" component={DeployModal} onEnter={loadDeployment()} />
				</ReactRouter.Route>
			</ReactRouter.Router>
		</ReactRedux.Provider>
	);
}

module.exports = Plan;
