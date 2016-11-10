var React = require("react");

// the styling and DOM is just a mock at the moment and will be replaced
// with the proper design

var Step = function(props) {
	let classNames = "step";

	var check = null;
	if (props.is_finished) {
		check = (<i className="fa fa-check" aria-hidden="true"></i>);
	}

	return (
		<li
			className={classNames}
			role="presentation"
		>
			{props.id + 1}. {props.title} {check}
		</li>
	);
};

Step.propTypes = {
	id: React.PropTypes.number.isRequired,
	title: React.PropTypes.string.isRequired
};

var StepMenu = function(props) {
	var list = Object.keys(props.steps).map(function(key, index) {
		return (
			<Step
				is_finished={props.steps[key].is_finished}
				key={index}
				title={props.steps[key].title}
				id={index}
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
	}).isRequired).isRequired
};

module.exports = StepMenu;
