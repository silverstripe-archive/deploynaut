var React = require("react");
var ReactDOM = require("react-dom");

module.exports = {
	/**
	 * Parses html-encoded JSON data from a application/json script tag.
	 */
	readInlineData: function readInlineData(id) {
		var dataElement = document.getElementById(id);
		var dataText = dataElement.textContent || dataElement.innerText;
		var decodeElement = document.createElement("textarea");
		decodeElement.innerHTML = dataText;
		return JSON.parse(decodeElement.value);
	},

	/**
	 * Render the specified react component onto the DOM Dispatcher shim named "name".
	 * See Dispatcher for description.
	 */
	install: function (reactElement, name) {
		var container = document.getElementById(name);
		if(container) {
			var modelId = container.getAttribute('data-model');
			ReactDOM.render(
				React.createElement(reactElement, {model: this.readInlineData(modelId)}),
				container
			);
		}
	}
}

