var React = require("react");

var TextArea = function(props) {
	return (
		<textarea
			className="form-control"
			rows={props.rows ? props.rows : "10"}
			name={props.name}
			value={props.value}
			onChange={props.onChange}
			disabled={props.disabled}
		/>
	);
};

TextArea.propTypes = {
	value: React.PropTypes.string.isRequired,
	name: React.PropTypes.string.isRequired,
	onChange: React.PropTypes.func.isRequired,
	disabled: React.PropTypes.bool
};

module.exports = TextArea;
