/**
 * Simple and basic html table filter
 *
 * Requires an <input> with <input class="table-filter" data-table="table-to-filter">
 * the input above refers to a <table class="table-to-filter">
 *
 * Note that the table must have a tbody
 *
 * @type {{init}}
 */
var TableFilter = (function(Arr) {

	var searchBox;

	function onInputEvent(evt) {
		searchBox = evt.target;
		// find the table(s) to search
		var tables = document.getElementsByClassName(searchBox.getAttribute('data-table'));
		// each table
		Arr.forEach.call(tables, function(table) {
			// each body
			Arr.forEach.call(table.tBodies, function(tbody) {
				Arr.forEach.call(tbody.rows, filter);
			});
		});
	}

	function filter(row) {
		var text = row.textContent.toLowerCase(), val = searchBox.value.toLowerCase();
		row.style.display = text.indexOf(val) === -1 ? 'none' : 'table-row';
	}

	return {
		init: function(className) {
			var inputs = document.getElementsByClassName(className);
			Arr.forEach.call(inputs, function(input) {
				input.oninput = onInputEvent;
			});
		}
	};
})(Array.prototype);
