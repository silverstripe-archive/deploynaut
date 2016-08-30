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

function sleep(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

export function call(uri, method, payload) {

	var options = {
		credentials: 'same-origin',
		method: method,
		headers: {
			Accept: 'application/json'
		}
	};

	if(method.toLowerCase() === "post") {
		options.body = new FormData();
		options.body.append(window.api_auth.name, window.api_auth.value);

		var data = payload || {};
		Object.keys(data).forEach(function(key) {
			options.body.append(key, payload[key]);
		});
	}

	return fetch(uri, options)
		.then(response => {
			if(response.ok) {
				return response.json().then(json => {
					window.api_auth = json.api_auth;
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

export function getRevisions() {
	return call(`${window.api_url}/gitrefs`, 'get');
}

export function updateRepo() {
	return call(`${window.api_url}/gitupdate`, 'post');
}

export function getSummary(sha) {
	return call(`${window.api_url}/deploysummary`, 'post', {sha: sha});
}

export function waitForSuccess(uri, retryInterval) {
	var retry = retryInterval || 100;
	return call(uri, 'get').then(data => {
		switch(data.status) {
			case 'Complete':
				return data;
			case 'Failed':
				throw new Error("An error occurred");
			default:
				return sleep(retry).then(() => waitForSuccess(uri, 2 * retry));
		}
	});
}
