var ReactRedux = require('react-redux');

var git = require('../../actions/git.js');
var Button = require('../../components/Button.jsx');

const mapStateToProps = function(state) {
	return {
		disabled: state.git.is_updating || state.approval.request_sent,
		style: "btn-default",
		value: state.git.is_updating ? "Updating code..." : "Update code"
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onClick: function() {
			dispatch(git.updateRepoAndGetRevisions());
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(Button);
