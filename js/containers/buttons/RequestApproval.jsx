var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');

const mapStateToProps = function(state) {
	return {
		display: !state.approval.request_sent && state.approval.approved_by && state.git.selected_ref,
		style: "btn-success",
		value: 'Send Request',
		icon: 'fa fa-envelope'
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onClick: function() {
			dispatch(actions.submitForApproval());
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Button);
