var ReactRedux = require('react-redux');

var DeployDiff = require('../components/DeployDiff.jsx');

const mapStateToProps = function(state) {
	return {
		changes: state.plan.changes,
		isLoading: state.plan.is_loading
	};
};

const mapDispatchToProps = function() {
	return {};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(DeployDiff);

