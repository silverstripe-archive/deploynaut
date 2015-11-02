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

	install: function (reactElement, name) {
		containerId = name;

		var container = document.getElementById(name);
		if(container) {
			modelId = container.getAttribute('data-model');
			React.render(
				React.createElement(reactElement, {model: this.readInlineData(modelId)}),
				container
			);
		}
	}
}

