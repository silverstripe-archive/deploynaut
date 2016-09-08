var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');

function canDeploy(state) {
	if (state.deployment.enqueued) {
		return false;
	}
	if (state.approval.bypassed) {
		return true;
	}
	if (state.approval.approved) {
		return true;
	}
	return false;
}

const mapStateToProps = function(state) {
	return {
		display: canDeploy(state),
		disabled: state.deployment.data.state !== 'Submitted',
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
