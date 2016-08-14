var React = require("react");
var _ = require('underscore');

/**
 * Defines a set of checkbox inputs that will submit as one input.
 * Note that some of these methods are duplicated in InputMixin, but it doesn't
 * look possible for this component to overload specific mixin methods.
 */
module.exports = React.createClass({

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
