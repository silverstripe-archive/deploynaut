var React = require("react");

var InputMixin = require("./FormInputMixin.jsx");

module.exports = React.createClass({
	mixins: [InputMixin],
	render: function () {
		var className = 'form-control';
		var alert;
		if (!this.state.isValid) {
			alert = <div className='validation-message'>{this.state.serverError || this.props.validationError}</div>;
			className += ' validation-error';
		}

		return (
			<div>
				{alert}
				<textarea
					id={this.props.name}
					className={className}
					name={this.props.name}
					onChange={this.setValue}
					rows={this.props.rows}
					cols={this.props.cols}
					placeholder={this.props.placeholder || ''}
				>
				{this.props.value}
				</textarea>
			</div>
		);
	}
});
