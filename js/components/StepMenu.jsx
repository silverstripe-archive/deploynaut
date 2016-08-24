var React = require("react");

// the styling and DOM is just a mock at the moment and will be replaced
// with the proper design

var Step = function(props) {
	var classNames = "";
	var style = {
		marginBottom: "4px"
	};

	if(props.active) {
		classNames = "alert-info";
	} else if(!props.show) {
		style.color = "#ddd";
	}

	var onclick = function() {};
	if(props.show) {
		style.cursor = "pointer";
		onclick = props.onClick;
	}

	var loading = null;
	if(props.isLoading) {
		loading = (<i className="fa fa-refresh fa-spin" aria-hidden="true"></i>);
	}

	var check = null;
	if(props.isFinished) {
		check = (<i className="fa fa-check" aria-hidden="true"></i>);
	}

	return (
		<div
			style={style}
			onClick={onclick}
			className={"alert " + classNames}
		>
			{props.id + 1}. {props.title} {loading} {check}
		</div>
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
				isFinished={props.steps[key].isFinished}
				key={index}
				onClick={function() { props.onClick(index); }}
				title={props.steps[key].title}
				id={index}
				show={props.steps[key].show}
				isLoading={props.steps[key].isLoading}
			/>
		);
	});

	return (<div> {list} </div>);
};

StepMenu.propTypes = {
	steps: React.PropTypes.arrayOf(React.PropTypes.shape({
		title: React.PropTypes.string.isRequired
	}).isRequired).isRequired,
	value: React.PropTypes.number.isRequired,
	onClick: React.PropTypes.func.isRequired
};

module.exports = StepMenu;
