var React = require("react");

var Dropdown = React.createClass({
	propTypes: {
		options: React.PropTypes.arrayOf(React.PropTypes.shape({
			id: React.PropTypes.oneOfType([
				React.PropTypes.string,
				React.PropTypes.number
			]).isRequired,
			title: React.PropTypes.string.isRequired
		}).isRequired),
		defaultValue: React.PropTypes.oneOfType([
			React.PropTypes.string,
			React.PropTypes.number,
			React.PropTypes.array
		]),
		value: React.PropTypes.oneOfType([
			React.PropTypes.string,
			React.PropTypes.number,
			React.PropTypes.array
		]),
		disabled: React.PropTypes.bool,
		onSelect: React.PropTypes.func.isRequired
	},

	getDefaultProps: function() {
		return {
			defaultText: 'Select an option'
		};
	},

	componentDidMount: function() {
		this.initSelectize();
	},

	// When props get updated we re-initialise the selector
	componentDidUpdate: function() {
		this.removeSelectize();
		this.initSelectize();
	},

	componentWillUnmount: function() {
		// we want to destroy selectize to prevent
		// onUpdate events to hang around after this
		// component have been unmounted.
		this.removeSelectize();
	},

	selector: null,

	// We are using the selectize library instead of select2 because
	// select2 causes a lot of bugs and the hacks didn't do it anymore.
	// The biggest problem is displaying a select2 dropdown in a bootstrap
	// modal that has overflow scrolling will break the scrolling.
	initSelectize: function() {
		$(this.selector).selectize({
			valueField: 'id',
			labelField: 'title',
			searchField: 'title',
			options: this.props.options
		});
		// push the set the default value from react to selectize
		if (typeof this.props.value !== 'undefined') {
			$(this.selector)[0].selectize.setValue(this.props.value);
		}
		// make sure that react get notified when values are picked
		$(this.selector)[0].selectize.on("change", function(value) {
			this.props.onSelect(value);
		}.bind(this));
	},

	removeSelectize: function() {
		if ($(this.selector)[0].selectize) {
			$(this.selector)[0].selectize.destroy();
		}
	},

	render: function() {
		var props = this.props;
		var options = [];
		var idx = 0;

		if (props.options) {
			options = Object.keys(props.options).map(function(index) {
				idx += 1;
				return (
					<option
						key={idx}
						value={props.options[index].id}
					>
						{props.options[index].title}
					</option>
				);
			});
		}

		options.unshift(<option key={"default"} value={""} disabled>{props.defaultText}</option>);
		return (
			<select
				ref={function(node) { this.selector = node; }.bind(this)}
				id={props.name}
				className='form-control disable-select2'
				name={props.name}
				onChange={props.onSelect}
				value={props.value}
				disabled={props.disabled}
			>
				{options}
			</select>
		);
	}
});

module.exports = Dropdown;
