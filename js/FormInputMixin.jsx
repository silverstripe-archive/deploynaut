var _ = require('underscore');

/**
 * Provides generic form input functionality that can be used to build your own form controls.
 *
 * @prop value Gets set as the initial value on the form control (like defaultValue in normal React inputs)
 * @prop onSetValue Handler called when the value changes, including when the initial value is set. The new value
 *	is passed as a parameter.
 */
module.exports = {
	getInitialState: function () {
		return {
			isValid: true,
			value: this.props.value || '',
			serverErrors: null
		};
	},
	componentWillMount: function () {
		this.props.attachToForm(this);
		if (_.has(this.props, 'onSetValue')) this.props.onSetValue(this.props.value);
	},
	componentWillUpdate: function(nextProps, nextState) {
		if (this.state.value !== nextState.value) {
			if (_.has(this.props, 'onSetValue')) this.props.onSetValue(nextState.value);
		}
	},
	componentWillUnmount: function () {
		this.props.detachFromForm(this);
	},
	setValue: function (event) {
		this.setState({
			value: event.currentTarget.value,
			isValid: true
		});
	}
}
