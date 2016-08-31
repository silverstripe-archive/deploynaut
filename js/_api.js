// polyfills
require('babel-polyfill');
var fetch = require('isomorphic-fetch');

export function APIError(message, json) {
	this.name = 'APIError';
	this.message = message || 'Something bad happened';
	this.json = json;
}
APIError.prototype = Object.create(Error.prototype);
APIError.prototype.constructor = APIError;

// SETUP_API is a cross dispatcher action that stores information recieved
// from the backend dispatcher so that the api class can dip into the store and
// find the correct endpoints and csrf tokens depending on the namespace
export const SET_API = 'SET_API';
export function setAPI(namespace, api_endpoint, api_auth) {
	return {
		type: SET_API,
		namespace: namespace,
		endpoint: api_endpoint,
		auth: api_auth
	};
}

/**
 *
 * @param time
 * @returns {Promise}
 */
function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

/**
 *
 * @param ns - string namespace
 * @returns {{getNamespace: getNamespace, call: call, waitForSuccess: waitForSuccess}}
 */
export function create(ns) {

	const namespace = ns;

	function call(dispatch, getState, uri, method, payload) {

		if(namespace === "") {
			throw Error("namespace must be set before api call");
		}

		var options = {
			credentials: 'same-origin',
			method: method,
			headers: {
				Accept: 'application/json'
			}
		};

		var fullURI = `${getState().api[namespace].endpoint}${uri}`;

		// post actions are the only actions that could possible change the state
		// and should therefore be protected by CSRF. GET/HEAD operations are
		// prefered to actions that doesn't change state.
		if(method.toLowerCase() === "post") {
			options.body = new FormData();

			const tokenName = `${getState().api[namespace].auth.name}`;
			const tokenValue = `${getState().api[namespace].auth.value}`;

			options.body.append(tokenName, tokenValue);

			var data = payload || {};
			Object.keys(data).forEach(function(key) {
				options.body.append(key, payload[key]);
			});
		}

		return fetch(fullURI, options)
			.then(response => {
				if(response.ok) {
					return response.json().then(json => {
						// if this instance of the api recieves new tokens for the
						// same namespace/dispatcher as it was sending, dispatch an
						// update for token changes
						if(json.namespace === namespace && typeof json.api_auth !== 'undefined') {
							dispatch(setAPI(json.namespace, json.api_endpoint, json.api_auth));
						}
						return json;
					});
				}
				// if the status code is outside of 200 - 299 we try to parse
				// the error that can either be some unexpected error or a nicer
				// API error response
				var message = `${response.status} - ${response.statusText}`;

				return response.json()
					.then(json => {
						if(json.message) {
							message = json.message;
						}
						throw new APIError(message, json);
					})
					.catch(APIError, err => {
						throw err;
					})
					// ignore any JSON parsing problems and throw the default exception
					.catch(() => {
						throw new Error(message);
					});
			});
	}

	function waitForSuccess(dispatch, getState, uri, retryInterval, callback) {
		var retry = retryInterval || 100;
		if(retry > 5000) {
			retry = 5000;
		}
		return call(dispatch, getState, uri, 'get').then(data => {
			if(callback) {
				callback(data);
			}
			switch(data.status) {
				case 'Complete':
					return data;
				case 'Failed':
					throw new Error("An error occurred");
				default:
					return sleep(retry).then(() => waitForSuccess(dispatch, getState, uri, 2 * retry, callback));
			}
		});
	}

	return {
		call,
		waitForSuccess
	};
}
