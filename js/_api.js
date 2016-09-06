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
// find the correct endpoints depending on the apiNamespace
export const SETUP_API = 'SETUP_API';
export function setupAPI(dispatchers, api_auth) {
	return {
		type: SETUP_API,
		dispatchers: dispatchers,
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
 * apiName is used to find the correct endpoint from the state store under
 * `store.api.dispatchers.${apiName}`
 *
 * @param apiName - string name of the api, used for finding the api endpoint
 * @returns {{call: call, waitForSuccess: waitForSuccess}}
 */
export function create(name) {

	const apiName = name;

	function call(getState, uri, method, payload) {

		var options = {
			credentials: 'same-origin',
			method: method,
			headers: {
				Accept: 'application/json'
			}
		};

		let fullURI = "";
		// check if uri is a relative or full uri
		if (uri.indexOf('://') > 0 || uri.indexOf('//') === 0 ) {
			fullURI = uri;
		} else {
			fullURI = `${getState().api.dispatchers[apiName]}${uri}`;
		}

		// post actions are the only actions that could possible change the state
		// and should therefore be protected by CSRF. GET/HEAD operations are
		// prefered to actions that doesn't change state.
		if(method.toLowerCase() === "post") {
			options.body = new FormData();

			const tokenName = `${getState().api.auth.name}`;
			const tokenValue = `${getState().api.auth.value}`;

			options.body.append(tokenName, tokenValue);

			var data = payload || {};
			Object.keys(data).forEach(function(key) {
				options.body.append(key, payload[key]);
			});
		}

		return fetch(fullURI, options)
			.then(response => {

				// the http response is in the 200 >=  <= 299 range
				if(response.ok) {
					return response.json().then(json => json);
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

	function waitForSuccess(getState, uri, retryInterval, callback) {
		var retry = retryInterval || 100;
		if(retry > 5000) {
			retry = 5000;
		}
		return call(getState, uri, 'get').then(data => {
			if(callback) {
				callback(data);
			}
			switch(data.status) {
				case 'Complete':
					return data;
				case 'Failed':
					throw new Error("An error occurred");
				default:
					return sleep(retry).then(() => waitForSuccess(getState, uri, 2 * retry, callback));
			}
		});
	}

	return {
		call,
		waitForSuccess
	};
}
