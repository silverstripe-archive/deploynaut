var ReactRedux = require('react-redux');

var actions = require('../../_actions.js');
var Button = require('../../components/Button.jsx');

const mapStateToProps = function(state) {
	let btnValue = state.git.is_updating ? "Fetch code..." : "Fetch code";

	if (state.git.error) {
		btnValue = state.git.error;
	}

	return {
		disabled: state.git.is_updating || state.deployment.submitted,
		style: "btn-default",
		value: btnValue
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onClick: function() {
			dispatch(actions.updateRepoAndGetRevisions());
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Button);
