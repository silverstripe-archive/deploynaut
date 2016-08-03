/* global Q */
var validator = require("validator");
var _ = require('underscore');

var React = require("react");
var ReactDOM = require("react-dom");

// Create a validation method that can be used as:
// equalsField|"firstFieldID"|"secondFieldID"
validator.extend('equalsField', function(string, firstFieldID, secondFieldID) {
	var first = document.getElementById(firstFieldID);
	var second = document.getElementById(secondFieldID);
	var firstValue = '';
	if(first.value) {
		firstValue = first.value;
	}
	var secondValue = '';
	if(second.value) {
		secondValue = second.value;
	}
	return firstValue === secondValue;
});

var Form = React.createClass({

	getInitialState: function () {
		return {
			isSubmitting: this.props.initialIsSubmitting || false,
			securityID: this.props.securityID,
			securityTokenName: this.props.securityTokenName || 'SecurityID'
		};
	},

	componentWillMount: function () {
		// We add a model to use when submitting the form
		this.model = {};
		// We create a map of traversed inputs
		this.inputs = {};
		// these are the child components that will be rendered
		this.amendedChildren = React.Children.map(this.props.children, this.amendChildren);
	},

	componentWillReceiveProps: function(nextProps) {
		if(!nextProps.securityID) {
			return;
		}
		this.setState({
			securityID: nextProps.securityID
		});
	},

	componentWillUpdate: function(nextProps) {
		// these are the child components that will be rendered
		this.amendedChildren = React.Children.map(nextProps.children, this.amendChildren);
	},

	/**
	 * Triggers global form error.
	 */
	setErrorOnForm: function(message) {
		var msg = message;
		if (!msg) {
			msg = 'Unspecified server error occured. Try again or contact the helpdesk if the problem persists.';
		}

		this.setState({
			serverMessage: msg,
			serverMessageType: 'error'
		});
	},

	/**
	 * Triggers errors on form fields matching passed object's keys.
	 */
	setErrorsOnInputs: function (errors) {
		var formError = [];
		_.keys(errors).forEach(function (name) {

			if (typeof this.inputs[name] !== 'undefined' && this.inputs[name]) {
				var component = this.inputs[name];

				component.setState({
					isValid: false,
					serverError: errors[name]
				});
			} else {
				// If the field does not exist, fall back to the global form error.
				formError.push(errors[name]);
			}

		}.bind(this));

		if (formError.length > 0) {
			this.setErrorOnForm(formError.join('<br/>'));
		}
	},

	// Submit the form if all fields validation passes and redirect if the
	// return contains a 'RedirectTo' value
	submit: function (event) {
		event.stopPropagation();
		event.preventDefault();

		if(!this.validateForm()) {
			return;
		}

		this.updateModel();

		this.setState({ isSubmitting: true });

		var self = this;
		var postData = {
			Details: JSON.stringify(this.model)
		};
		postData[this.state.securityTokenName] = this.state.securityID;
		Q($.ajax({
			type: "POST",
			url: this.props.url,
			data: postData
		})).then(function(data) {
			if(data.NewSecurityID) {
				self.setState({ securityID: data.NewSecurityID });
			}
			if(self.props.afterSuccess) {
				self.props.afterSuccess(data);
			} else {
				self.afterSuccess(data);
			}
		}, function(response) {
			self.afterFailure(response);
			self.setState({ isSubmitting: false });
		}).catch(function(errorMessage) {
			console.error(errorMessage);
		});
	},

	afterSuccess: function(data) {
		if(data.RedirectTo) {
			window.location.href = data.RedirectTo;
		}
	},

	afterFailure: function(response) {
		this.setState({ isSubmitting: false });

		var ct = response.getResponseHeader("content-type") || "";
		if (ct.indexOf('json') > -1) {
			// The response may be parse-able JSON with "InputErrors" structure holding field-specific errors.
			var json = {};
			try {
				json = JSON.parse(response.responseText);
			} catch (e) {
				var errMsg = 'Received badly formatted response. Try again or contact ';
				errMsg += 'the helpdesk if the problem persists.';
				this.setErrorOnForm(errMsg);
			}

			if(typeof json.NewSecurityID !== 'undefined') {
				this.setState({ securityID: json.NewSecurityID });
			}

			if(_.size(json.InputErrors) > 0) {
				this.setErrorsOnInputs(json.InputErrors);
			} else {
				this.setErrorOnForm(null);
			}
		} else {
			// No JSON, use the message literally.
			this.setErrorOnForm(response.responseText);
		}
	},

	validateForm: function () {

		var allIsValid = true;

		var inputs = this.inputs;
		var self = this;
		// Validate all the Input components
		_.keys(inputs).forEach(function (name) {
			if(!self.validate(inputs[name])) {
				allIsValid = false;
			}
		});
		this.setState({ isValid: allIsValid });
		return allIsValid;
	},

	// The validate method grabs what it needs from the component,
	// validates the component and then validates the form
	validate: function (component) {

		if (!component.props.validations) {
			return true;
		}

		var isValid = true;

		if (component.state.value || component.props.required) {

			component.props.validations.split('/').forEach(function (validation) {
				// By splitting on "|" we get an array of arguments that we pass
				// to the validator. ex.: isLength|5 -> ['isLength', '5']
				var args = validation.split('|');

				var validateMethod = args.shift();

				// We use JSON.parse to convert the string values passed to the
				// correct type. Ex. 'isLength|1' will make '1' actually a number
				args = args.map(function (arg) {
					return JSON.parse(arg);
				});

				args = [component.state.value].concat(args);

				if(typeof validator[validateMethod] === 'undefined') {
					var debugWarning = 'Validation method "' + validateMethod;
					debugWarning += '" on component "' + component.props.name + '" doesn\'t exists';
					console.warn(debugWarning);

				} else {
					// this is effectively a call to something like:
					// `validator.isLength('valueFromInput', 5)`
					isValid = (!validator[validateMethod].apply(validator, args));
				}
			});

			component.setState({
				isValid: isValid,
				serverError: null
			});
		}

		return isValid;
	},

	// This is called on submit and updates the model with the values from the
	// child input components and the latest CSRF token
	updateModel: function () {
		_.keys(this.inputs).forEach(function (name) {
			this.model[name] = this.inputs[name].state.value;
		}.bind(this));
	},

	// Child input components will call this method when they are mounting
	attachToForm: function (component) {
		this.inputs[component.props.name] = component;
		this.model[component.props.name] = component.state.value;
	},

	// Child input components will call this method when they are unmounting
	detachFromForm: function (component) {
		delete this.inputs[component.props.name];
		delete this.model[component.props.name];
	},

	// We will need to clone the child component(s) because we need to add and
	// change their properties to them. ReactJS doesn't allow you to change
	// properties because they are immutable.
	amendChildren: function(child) {

		if(!child || !child.props) {
			return child;
		}

		// If this component has a child components, we need to amend them as well
		var children = [];
		if(child.props.children) {
			children = React.Children.map(child.props.children, this.amendChildren);
		}

		// Child is not a Input component so just change the (eventual) children props
		if(typeof child.props.name === 'undefined') {
			return React.cloneElement(child, {children: children});
		}

		var validations = child.props.validations;
		// Dynamically add a 'required' validation
		if(child.props.required) {
			validations = validations ? validations + '/' : '';
			validations += 'isLength|1';
		}

		return React.cloneElement(child, {
			attachToForm: this.attachToForm,
			detachFromForm: this.detachFromForm,
			validations: validations,
			children: children
		});
	},

	render: function () {
		var message = "";
		if (this.state.serverMessage) {
			message = (
				<div
					className={'alert alert-' + this.state.serverMessageType}
					dangerouslySetInnerHTML={{__html:this.state.serverMessage}}
				/>
			);
		}

		var cancelButton = null;

		if(this.props.cancelButton) {
			cancelButton = this.props.cancelButton;
		}

		var buttonTitle = 'Submit';
		if(this.props.buttonTitle) {
			buttonTitle = this.props.buttonTitle;
		}
		var buttonSubmittingTitle = "Submitting";
		if(this.props.buttonSubmittingTitle) {
			buttonSubmittingTitle = this.props.buttonSubmittingTitle;
		}
		return (
			<form onSubmit={this.submit} className="form">
				{message}
				{this.amendedChildren}
				<div className="btn-toolbar">
					<button
						className="btn btn-primary"
						type="submit"
						disabled={this.state.isSubmitting}
					>
						{this.state.isSubmitting ? buttonSubmittingTitle : buttonTitle}
					</button>
					{cancelButton}
				</div>
			</form>
		);
	}
});

/**
 * Provides generic form input functionality that can be used to build your own form controls.
 *
 * @prop value Gets set as the initial value on the form control (like defaultValue in normal React inputs)
 * @prop onSetValue Handler called when the value changes, including when the initial value is set. The new value
 *	is passed as a parameter.
 */
var InputMixin = {
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
};

var Input = React.createClass({
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

var Textarea = React.createClass({
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

/**
 * Requires an array of objects containing "id" and "value" props.
 */
var Select = React.createClass({
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
				<option key={option.id} value={option.id}>{option.value}</option>
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

/**
 * Defines a set of checkbox inputs that will submit as one input.
 * Note that some of these methods are duplicated in InputMixin, but it doesn't
 * look possible for this component to overload specific mixin methods.
 */
var CheckboxSet = React.createClass({

	getInitialState: function() {
		// get the initial structure of the input states for internally
		// knowing what is checked. This gets updated by setValue
		// internally
		var data = _.map(this.props.source, function(value) {
			return {
				value: value,
				title: this.props.source[value],
				selected: _.contains(this.props.value, value)
			};
		}.bind(this));

		return {
			isValid: true,
			data: data,
			value: this.props.value || [],
			serverErrors: null
		};
	},

	componentWillMount: function() {
		this.props.attachToForm(this);
		if (_.has(this.props, 'onSetValue')) this.props.onSetValue(this.props.value);
	},

	componentWillUpdate: function(nextProps, nextState) {
		if (this.state.value !== nextState.value) {
			if (_.has(this.props, 'onSetValue')) this.props.onSetValue(nextState.value);
		}
	},

	componentWillUnmount: function() {
		this.props.detachFromForm(this);
	},

	handleCheckboxChange: function(checkboxValue) {
		var newValue = [];
		var data = this.state.data.map(function(item) {
			var selected = (item.value === checkboxValue ? !item.selected : item.selected);

			// set the value of the field to be the items that are selected
			if (selected === true) {
				newValue.push(item.value);
			}

			return {
				value: item.value,
				title: item.title,
				selected: selected
			};
		});

		this.setState({
			data: data,
			value: newValue
		});
	},

	render: function() {
		var alert;
		if (!this.state.isValid) {
			alert = <div className='validation-message'>{this.state.serverError || this.props.validationError}</div>;
		}

		var wrapperCss = 'checkbox';
		if(this.props.inline) {
			wrapperCss = 'checkbox-inline';
		}

		var inputs = this.state.data.map(function(item) {
			return (
				<div className={wrapperCss} key={this.name + "_" + item.value}>
				<label htmlFor={this.name + "_" + item.value}>
					<input
						className="checkbox"
						type="checkbox"
						id={this.name + "_" + item.value}
						name={this.name + "[]"}
						value={item.value}
						onChange={this.handleCheckboxChange.bind(this, item.value)}
						checked={item.selected}
					/>
					{item.title}
				</label>
				</div>
			);
		}.bind(this));

		return (
			<div>
				{alert}
				{inputs}
			</div>
		);
	}
});

var Password = React.createClass({
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
					type="password"
					className={className}
					name={this.props.name}
					onChange={this.setValue}
					value={this.state.value}
				/>
			</div>
		);
	}
});

var PasswordConfirm = React.createClass({
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
				<input
					id={this.props.name}
					type="password"
					className={className}
					name={this.props.name}
					onChange={this.setValue}
					value={this.state.value}
				/>
				{alert}
			</div>
		);
	}
});

exports.Form = Form;
exports.InputMixin = InputMixin;
exports.Input = Input;
exports.Textarea = Textarea;
exports.Select = Select;
exports.CheckboxSet = CheckboxSet;
exports.Password = Password;
exports.PasswordConfirm = PasswordConfirm;
