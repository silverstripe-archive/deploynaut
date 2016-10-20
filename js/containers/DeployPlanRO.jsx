const React = require('react');
const ReactRedux = require('react-redux');

function DeployPlanRO(props) {
	return (
		<div>
			<div className="section deploy-plan">
				<header id="1">Deployment Plan</header>
				<div className="summary_title">{props.title}</div>
				<p className="summary_of_changes">
					{props.summary_of_changes}
				</p>
			</div>
		</div>
	);
}

const mapStateToProps = function(state) {
	return {
		title: state.plan.title,
		summary_of_changes: state.plan.summary_of_changes
	};
};

const mapDispatchToProps = function() {
	return {};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(DeployPlanRO);

