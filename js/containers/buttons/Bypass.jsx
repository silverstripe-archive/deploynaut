var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');

function canBypass(state) {
	if(state.approval.bypassed) {
		return false;
	}

	if(state.approval.approved) {
		return false;
	}

	if(state.approval.request_sent) {
		return false;
	}

	return true;
}

const mapStateToProps = function(state) {

	return {
		display: canBypass(state),
		style: "btn-success",
		value: "Bypass"
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onClick: function() {
			dispatch(actions.bypassApproval());
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Button);
