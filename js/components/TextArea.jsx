var React = require("react");

var TextArea = function(props) {
	return (
		<textarea
			id={props.id ? props.id : null}
			className="form-control"
			rows={props.rows ? props.rows : "10"}
			name={props.name ? props.name : null}
			value={props.value}
			onChange={props.onChange}
			disabled={props.disabled}
		/>
	);
};

TextArea.propTypes = {
	value: React.PropTypes.string.isRequired,
	onChange: React.PropTypes.func.isRequired,
	disabled: React.PropTypes.bool
};

module.exports = TextArea;
