const ReactRedux = require('react-redux');

const actions = require('../../_actions.js');
const constants = require('../../constants/deployment.js');
const Button = require('../../components/Button.jsx');

const mapStateToProps = function(state) {
	const current = state.deployment.list[state.deployment.current_id] || {};

	let text = 'Abort';
	if (state.deployment.abort_is_loading) {
		text = 'Requesting abort';
	} else if (constants.isAborting(current.state)) {
		text = 'Force abort';
	}

	const icon = state.deployment.abort_is_loading ? 'fa fa-refresh fa-spin' : 'fa fa-hand-paper-o';
	return {
		display: state.user.can_abort_deployment && constants.canAbort(current.state),
		disabled: state.deployment.abort_is_loading,
		style: 'btn-wide btn-danger',
		value: text,
		icon: icon
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onClick: function() {
			dispatch(actions.abortDeployment());
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Button);
