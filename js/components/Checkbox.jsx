var React = require("react");

var Checkbox = function (props) {
	var classes = "checkbox";
	if (props.disabled === true) {
		classes += " disabled";
	}
	return (
		<div className={classes} >
			<label htmlFor={props.name + props.id}>
				<input
					onChange={props.onClick}
					type="checkbox"
					name={props.name + props.id}
					id={props.name + props.id}
					value={props.id}
					checked={props.checked}
					disabled={(props.disabled === true)}
				/>
				{props.description}
			</label>
		</div>
	);
};

Checkbox.propTypes = {
	id: React.PropTypes.number.isRequired,
	name:  React.PropTypes.string.isRequired,
	description: React.PropTypes.string.isRequired,
	checked: React.PropTypes.bool.isRequired,
	onClick: React.PropTypes.func.isRequired,
	disabled: React.PropTypes.bool
};

module.exports = Checkbox;
