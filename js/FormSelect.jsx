var React = require("react");
var ReactDOM = require("react-dom");

var InputMixin = require("./FormInputMixin.jsx");

/**
 * Requires an array of objects containing "id" and "value" props.
 */
module.exports = React.createClass({
	mixins: [InputMixin],

	componentDidMount: function() {
		// Trigger handler only needed if there is no explicit button.
		$(ReactDOM.findDOMNode(this.refs.selector)).select2().on("change", this.setValue);
	},

	render: function () {
		var className = 'form-control';
		var alert;
		if (!this.state.isValid) {
			alert = (
				<div className='validation-message'>
					{this.state.serverError || this.props.validationError}
				</div>
			);
			className += ' validation-error';
		}

		var options = this.props.options.map(function(option) {
			return (
				<option
					key={option.id}
					value={option.id}
				>
					{option.value}
				</option>
			);
		});

		return (
			<div>
				{alert}
				<select
					ref="selector"
					id={this.props.name}
					className={className}
					name={this.props.name}
					onChange={this.setValue}
					value={this.state.value}
				>
					{options}
				</select>
			</div>
		);
	}
});
