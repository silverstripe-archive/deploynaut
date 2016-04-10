var _ = require('underscore');

/**
 * VariableTable displays variable => value pairs in a table. It also provides a button
 * to transition to the editing stage.
 *
 * @param array variables Contains the list of key=>values
 *   [
 *     { variable: key1, value: val1	},
 *     { variable: key2, value: val2	},
 *     ...
 *   ]
 * @param function edit Handler for triggering a transition to editing.
 * @param bool showValues Set to false to hide value column.
 * @param bool showHeading Set to false to hide the header row.
 * @param string variableHeading Set the heading for the variable column.
 * @param string valueHeading Set the heading for the value column.
 */
var VariableTable = React.createClass({

	getDefaultProps: function() {
		return {
			showValues: true,
			showHeading: true,
			variableHeading: "Variable <small>(string)</small>",
			valueHeading: "Value <small>(string)</small>"
		};
	},

	render: function() {
		var self = this;
		var rows = _.map(this.props.variables, function(item) {
			return (
				<VariableTableRow
					key={item.variable + '_' + item.value}
					variable={item.variable}
					value={item.value}
					showValues={self.props.showValues}
					/>
			);
		});

		var valueHeading = null;
		if (this.props.showValues) {
			valueHeading = <th className="value" dangerouslySetInnerHTML={{__html:this.props.valueHeading}} />
		}

		var heading = null;
		if (this.props.showHeading) {
			heading = (
				<thead>
					<tr>
						<th className="variable" dangerouslySetInnerHTML={{__html:this.props.variableHeading}} />
						{valueHeading}
					</tr>
				</thead>
			);
		}

		return (
			<div className="variables">
				<div className="variables-actions variable-table-actions">
					<button type="button" className="btn btn-primary" onClick={this.props.edit}>Edit</button>
				</div>
				<table className="variable-table table">
					{heading}
					<tbody>
						{rows}
					</tbody>
				</table>
			</div>
		);
	}
});

var VariableTableRow = React.createClass({
	render: function() {

		var value = null;
		if (this.props.showValues) {
			value = <td>{this.props.value}</td>;
		}

		return (
			<tr>
				<td>{this.props.variable}</td>
				{value}
			</tr>
		);
	}
});

module.exports = VariableTable;
