var React = require("react");

var Dropdown = React.createClass({
	propTypes: {
		options: React.PropTypes.arrayOf(React.PropTypes.shape({
			key: React.PropTypes.oneOfType([
				React.PropTypes.string,
				React.PropTypes.number
			]).isRequired,
			value: React.PropTypes.string.isRequired
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
			defaultText: 'select an option'
		};
	},

	componentDidMount: function() {
		this.destroySelect2();
		this.initSelect2();
	},

	componentDidUpdate: function() {
		this.destroySelect2();
		this.initSelect2();
	},

	componentWillUnmount: function() {
		this.destroySelect2();
	},

	selector: null,

	initSelect2: function() {
		$(this.selector).select2(this.props.options);
		$(this.selector).select2().on("change", function(evt) {
			const value = evt.currentTarget.value;
			this.props.onSelect(value);
		}.bind(this));

		if (typeof this.props.value !== 'undefined') {
			$(this.selector).val(this.props.value);
		}
	},

	destroySelect2: function() {
		if ($(this.selector).data('select2')) {
			$(this.selector).select2().off("change");
			$(this.selector).select2("destroy");
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
						value={props.options[index].key}
					>
						{props.options[index].value}
					</option>
				);

			});
		}

		options.unshift(<option key={"default"} value={""} disabled>{props.defaultText}</option>);
		var className = 'form-control';
		return (
			<select
				ref={function(node) { this.selector = node; }.bind(this)}
				id={props.name}
				className={className}
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
