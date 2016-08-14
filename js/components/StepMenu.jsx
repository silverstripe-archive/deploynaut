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

	return (
		<div
			style={style}
			onClick={onclick}
			className={"alert " + classNames}
		>
			{props.id + 1}. {props.title}
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
	var list = Object.keys(props.tabs).map(function(key, index) {
		return (
			<Step
				active={props.value === index}
				key={index}
				onClick={function() { props.onClick(index); }}
				title={props.tabs[key].title}
				id={index}
				show={props.tabs[key].show}
			/>
		);
	});
	return (<div> {list} </div>);
};

StepMenu.propTypes = {
	tabs: React.PropTypes.arrayOf(React.PropTypes.shape({
		id: React.PropTypes.number.isRequired,
		title: React.PropTypes.string.isRequired
	}).isRequired).isRequired,
	value: React.PropTypes.number.isRequired,
	onClick: React.PropTypes.func.isRequired
};

module.exports = StepMenu;
