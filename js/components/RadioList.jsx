var React = require("react");

var Radio = require('./Radio.jsx');

function RadioList(props) {
	if (!props.options) {
		return null;
	}

	var list = Object.keys(props.options).map(function(key, index) {
		return (
			<Radio
				key={props.options[key].id}
				description={props.options[key].description}
				name="type"
				checked={props.value === props.options[key].id}
				id={index}
				onClick={() => props.onRadioClick(props.options[key].id, props.options[key])}
				disabled={props.disabled}
			/>
		);
	});

	return (
		<form className="form">
			{list}
		</form>
	);
}

RadioList.propTypes = {
	options: React.PropTypes.objectOf(React.PropTypes.shape({
		id: React.PropTypes.number.isRequired,
		description: React.PropTypes.string.isRequired
	}).isRequired).isRequired,
	disabled: React.PropTypes.bool,
	active: React.PropTypes.number,
	onRadioClick: React.PropTypes.func.isRequired
};

module.exports = RadioList;
