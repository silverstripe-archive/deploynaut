var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');
const constants = require('../../constants/deployment.js');

function canDeploy(state) {
	if (constants.hasDeployStarted(state.deployment.state)) {
		return false;
	}
	if (state.deployment.queued) {
		return false;
	}
	if (state.deployment.approved) {
		return true;
	}
	return false;
}

const mapStateToProps = function(state) {
	return {
		display: canDeploy(state),
		style: "btn-success",
		value: "Deploy"
	};
};

const mapDispatchToProps = function(dispatch, ownProps) {
	return {
		onClick: function() {
			dispatch(actions.startDeploy(ownProps.sha));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Button);
