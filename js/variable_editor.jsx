var trim = require('underscore.string/trim');
var _ = require('underscore');

/**
 * VariableEditor allows editing variable => value pairs, with an inline "add" and "remove"
 * capability. Variables need to be kept unique.
 *
 * @param array variables Contains the list of key=>values
 *   [
 *     { variable: key1, value: val1	},
 *     { variable: key2, value: val2	},
 *     ...
 *   ]
 * @param array blacklist Array of blacklisted keys.
 * @param function submit Submission handler (gets passed the same variables struct as above, expects a promise).
 * @param function cancel Cancel handler.
 * @param function validateVariable Handler to call to validate a variable (gets passed a value, returns message).
 * @param bool showValues Set to false to hide value column.
 * @param bool showHeading Set to false to hide the header row.
 * @param string variableHeading Set the heading for the variable column.
 * @param string valueHeading Set the heading for the value column.
 */
var VariableEditor = React.createClass({

	deepCopyVariables: function(from) {
		var to = [];
		for (var i=0; i<from.length; i++) {
			if (!from[i].deleted && !from[i].vacant) {
				to.push({
					variable: from[i].variable,
					value: from[i].value
				});
			}
		}

		return to;
	},

	getDefaultProps: function() {
		return {
			validateVariable: function(value) {
				var message = '';
				if (value.match(/[^a-zA-Z_0-9]/)) {
					message = "Only alphanumerics and underscore permitted.";
				}
				if (value.match(/^[0-9]/)) {
					message = "Value cannot start with a digit.";
				}
				return message;
			},
			showValues: true,
			showHeading: true,
			variableHeading: "Variable <small>(string)</small>",
			valueHeading: "Value <small>(string)</small>"
		};
	},

	getInitialState: function() {

		var variables = this.deepCopyVariables(this.props.variables);

		// Add additional state needed for editing.
		for (var i=0; i<variables.length; i++) {
			variables[i].error = "";
			variables[i].vacant = false;
			variables[i].deleted = false;
		}

		variables.push({
			variable: "",
			value: "",
			error: "",
			vacant: true,
			deleted: false
		});

		return {
			saving: false,
			variables: variables,
			valid: true,
			message: ""
		};
	},

	save: function(event) {
		event.stopPropagation();
		event.preventDefault();

		this.setState({
			saving: true,
			message: ""
		});

		// Deep copying also filters the variables.
		var newVariables = this.deepCopyVariables(this.state.variables);

		var self = this;
		this.props.submit(newVariables)
			.fin(function() {
				// it's possible that the this.props.submit will unmount this
				// component due to state changes, this guards against setting
				// state on a unmounted component
				if(self.isMounted()) {
					self.setState({
						saving: false
					});
				}
			});
	},

	/**
	 * Main model is represented by an array, kept in the state. Wrap rows in a proxy object
	 * so that we can manipulate on them as if they were individual items.
	 *
	 * @param int row Row index in the variables array. If the index is past the end of the array, it's treated
	 *	as a new item that can be added into the model.
	 */
	rowStateProxy: function(row) {
		var self = this;

		var updateState = function() {
			self.setState({variables: self.state.variables});
		};

		var isVariableUnique = function(variable) {
			for (var i=0; i<self.state.variables.length; i++) {
				if (row!=i
					&& !self.state.variables[i].deleted
					&& !self.state.variables[i].vacant
					&& self.state.variables[i].variable===variable
				) return false;
			}
			return true;
		};

		return ({
			isVacant: function() {
				return (typeof self.state.variables[row].vacant!=='undefined' && self.state.variables[row].vacant);
			},
			setVariable: function(variable) {
				if (self.state.variables[row].vacant) {
					self.state.variables.push({
						variable: "",
						value: "",
						vacant: true
					});
				}

				self.state.variables[row].variable = variable;
				self.state.variables[row].vacant = false;
				updateState();
			},
			setValue: function(value) {
				self.state.variables[row].value = value;
				updateState();
			},
			remove: function() {
				self.state.variables[row].deleted = true;
				updateState();
			},
			validateVariable: function(value) {
				var message = self.props.validateVariable(value);
				if (trim(value)==="") {
					message = "Value cannot be empty.";
				}
				if (!isVariableUnique(value)) {
					message = "Value already exists.";
				}
				if (self.props.blacklist) {
					for (var i=0; i<self.props.blacklist.length; i++) {
						var re = new RegExp(self.props.blacklist[i]);
						if (value.match(re)) {
							message = "Value not allowed.";
							break;
						}
					}
				}

				self.state.variables[row].error = message ? true : false;
				updateState();
				return message;
			}
		});
	},

	isFormValid: function() {
		for (var i=0; i<this.state.variables.length; i++) {
			if (!this.state.variables[i].vacant
					&& !this.state.variables[i].deleted
					&& this.state.variables[i].error) return false;
		}

		return true;
	},

	render: function() {
		var formValid = this.isFormValid();

		var self = this;
		var i = 0;
		var readonlyRows = _.map(this.props.readonlyVariables, function(item) {
			var row = (
				<VariableEditorReadonlyRow
					showValues={self.props.showValues}
					key={"readonly-" + i}
					variable={item.variable}
					value={item.value}
				/>
			);
			i++;
			return row;
		});

		var j = 0;
		var rows = _.map(this.state.variables, function(item) {
			var row;
			if (!item.deleted) {
				// Rely on the positional number of the model row as the key. As rows are deleted,
				// the variables will get marked up with "deleted: true", but remain in the model
				// to ensure react knows what rows to changed.
				row = (
					<VariableEditorRow
						showValues={self.props.showValues}
						key={j}
						disabled={self.state.saving}
						variable={item.variable}
						value={item.value}
						rowState={self.rowStateProxy(j)}
					/>
				);
			}
			j++;
			return row;
		});

		var message = null;
		if (this.state.message) {
			message = (
				<div className="alert alert-danger">{this.state.message}</div>
			)
		}

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
						<th className="actions">&nbsp;</th>
					</tr>
				</thead>
			);
		}

		return (
			<div className="variables">
				<form className="variable-editor" onSubmit={this.save} >
					<VariableEditorActions
						disabled={!formValid}
						saving={this.state.saving}
						cancel={this.props.cancel} />
					{message}
					<table className="table">
						{heading}
						<tbody>
							{readonlyRows}
							{rows}
						</tbody>
					</table>
				</form>
			</div>
		);
	}
});

var VariableEditorActions = React.createClass({
	render: function() {
		var buttonText = "";
		if (this.props.saving) {
			buttonText = "Saving..."
		} else {
			buttonText = "Save";
		}

		return (
			<div className="variables-actions variable-editor-actions">
				<input type="submit" disabled={this.props.disabled || this.props.saving} className="btn btn-primary" value={buttonText} />
				<button type="button" className="btn btn-default" disabled={this.props.disabled || this.props.saving} onClick={this.props.cancel}>Cancel</button>
			</div>
		);
	}
});

var VariableEditorRow = React.createClass({

	handleVariableChange: function(event) {
		this.props.rowState.setVariable(event.target.value);
	},

	handleValueChange: function(event) {
		this.props.rowState.setValue(event.target.value);
	},

	render: function() {
		var remove = null;

		if (!this.props.rowState.isVacant() && !this.props.disabled) {
			remove = (
				<button type="button" className="btn btn-danger" onClick={this.props.rowState.remove} disabled={this.props.disabled}>
					<span className="fa fa-times no-text" aria-hidden="true"></span>
				</button>
			);
		}

		var value = null;
		if (this.props.showValues) {
			value = <td className="value">
					<input disabled={this.props.disabled} className='form-control' type="text" value={this.props.value}
						onChange={this.handleValueChange} />
				</td>
		}

		return (
			<tr>
				<td className="variable">
					<ValidatableInput disabled={this.props.disabled} type="text" value={this.props.variable} onChange={this.handleVariableChange}
						onValidate={this.props.rowState.validateVariable} />
				</td>
				{value}
				<td className="actions">
					{remove}
				</td>
			</tr>
		);
	}
});

var VariableEditorReadonlyRow = React.createClass({

	render: function() {
		var value = null;
		if (this.props.showValues) {
			value = <td className="value">{this.props.value}</td>;
		}

		return (
			<tr>
				<td className="variable">{this.props.variable}</td>
				{value}
				<td className="actions text-center">
					<i className="fa fa-lock"></i>
				</td>
			</tr>
		);
	}

});

/**
 * Input field with an ability to show an error message. Pass validate, onValidationFail and onValidationSuccess
 * callbacks to handle the error messaging.
 */
var ValidatableInput = React.createClass({
	getInitialState: function() {
		return {
			message: ""
		};
	},

	handleChange: function(event) {
		var message = this.props.onValidate(event.target.value);
		this.setState({message: message});
		if (this.props.onChange) this.props.onChange(event);
	},

	render: function() {
		var className = 'form-control';
		var alert = null;
		if (this.state.message) {
			alert = <div className='validation-message'>{this.state.message}</div>;
			className += ' validation-error';
		}
		return (
			<div className="form-group">
				<input disabled={this.props.disabled} className={className} type={this.props.type}
					onChange={this.handleChange} value={this.props.value} />
				{alert}
			</div>
		);
	}
});

module.exports = VariableEditor;
