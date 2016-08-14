var React = require("react");

function Button(props) {
	if(!props.display) {
		return null;
	}
	var icon = null;
	if(props.icon !== "") {
		icon = (
			<i className={props.icon} aria-hidden="true"></i>
		);
	}
	return (
		<button
			className={"btn " + props.style}
			onClick={props.onClick}
			disabled={props.disabled}
		>
			{icon}
			{props.value}
		</button>
	);
}

Button.defaultProps = {
	display: true,
	style: "btn-primary",
	disabled: false,
	value: "button",
	icon: ""
};

module.exports = Button;
