var React = require("react");

var Radio = function (props) {

	var classes = "radio";
	if(props.disabled === true) {
		classes += " disabled";
	}
	return (
		<div className={classes} >
			<label htmlFor={props.name + props.id}>
				<input
					onChange={props.onClick}
					type="radio"
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

Radio.propTypes = {
	id: React.PropTypes.number.isRequired,
	name:  React.PropTypes.string.isRequired,
	description: React.PropTypes.string.isRequired,
	checked: React.PropTypes.bool.isRequired,
	onClick: React.PropTypes.func.isRequired,
	disabled: React.PropTypes.bool
};

module.exports = Radio;
