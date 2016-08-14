var ReactRedux = require('react-redux');

var SummaryTable = require('../SummaryTable.jsx');

const mapStateToProps = function(state) {
	return {
		changes: state.changes
	};
};

const mapDispatchToProps = function() {
	return {};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(SummaryTable);

