var ReactRedux = require('react-redux');

var actions = require('../../actions/misc.js');
var Button = require('../../components/Button.jsx');

function canDeploy(state) {
	if(state.deployment.enqueued) {
		return false;
	}
	if(state.approval.bypassed) {
		return true;
	}
	if(state.approval.approved) {
		return true;
	}
	return false;
}

const mapStateToProps = function(state) {
	return {
		display: canDeploy(state),
		disabled: false,
		style: "btn-success",
		value: "Deploy"
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onClick: function() {
			dispatch(actions.startDeploymentEnqueue());
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Button);
