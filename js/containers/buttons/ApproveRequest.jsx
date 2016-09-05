var ReactRedux = require('react-redux');

var actions = require('../../actions/misc.js');
var Button = require('../../components/Button.jsx');

const mapStateToProps = function(state) {
	return {
		display: state.approval.request_sent && !state.approval.approved,
		style: "btn-success",
		value: "Approve deployment"
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onClick: function() {
			dispatch(actions.startApprovalAprove());
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Button);
