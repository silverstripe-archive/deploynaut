var React = require("react");

// the styling and DOM is just a mock at the moment and will be replaced
// with the proper design

var Step = function(props) {
	let classNames = "step";

	if (props.active) {
		classNames += " active";
	} else if (props.show) {
		classNames += " selectable";
	}

	var onclick = function() {};
	if (props.show) {
		onclick = props.onClick;
	}

	var loading = null;
	if (props.is_loading) {
		loading = (<i className="fa fa-refresh fa-spin" aria-hidden="true"></i>);
	}

	var check = null;
	if (props.is_finished) {
		check = (<i className="fa fa-check" aria-hidden="true"></i>);
	}

	return (
		<li
			href={"#" + props.id}
			onClick={onclick}
			className={classNames}
			role="presentation"
		>
			{props.id + 1}. {props.title} {loading} {check}
		</li>
	);
};

Step.propTypes = {
	id: React.PropTypes.number.isRequired,
	title: React.PropTypes.string.isRequired,
	active: React.PropTypes.bool.isRequired,
	onClick: React.PropTypes.func.isRequired
};

var StepMenu = function(props) {
	var list = Object.keys(props.steps).map(function(key, index) {
		return (
			<Step
				active={props.value === index}
				is_finished={props.steps[key].is_finished}
				key={index}
				onClick={() => props.onClick(index)}
				title={props.steps[key].title}
				id={index}
				show={props.steps[key].show}
				is_loading={props.steps[key].is_loading}
			/>
		);
	});

	return (
		<ul className="nav nav-pills nav-stacked">
			{list}
		</ul>
	);
};

StepMenu.propTypes = {
	steps: React.PropTypes.arrayOf(React.PropTypes.shape({
		title: React.PropTypes.string.isRequired
	}).isRequired).isRequired,
	value: React.PropTypes.number.isRequired,
	onClick: React.PropTypes.func.isRequired
};

module.exports = StepMenu;
