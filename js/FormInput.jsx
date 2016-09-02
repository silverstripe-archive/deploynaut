var React = require("react");

var InputMixin = require("./FormInputMixin.jsx");

module.exports = React.createClass({
	mixins: [InputMixin],
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
		return (
			<div>
				{alert}
				<input
					id={this.props.name}
					type="text"
					className={className}
					name={this.props.name}
					onChange={this.setValue}
					value={this.state.value}
				/>
			</div>
		);
	}
});
