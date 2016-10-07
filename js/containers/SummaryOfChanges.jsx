var React = require('react');
var ReactRedux = require('react-redux');

var TextArea = require('../components/TextArea.jsx');
var actions = require('../_actions.js');
const deployment = require('../constants/deployment.js');

var summary = function(props) {
	return (

		<div className="form-group">
			<label htmlFor="summary">Description:</label>
				<TextArea
					name="summary"
					value={props.summary_of_changes}
					onChange={props.onChange}
					disabled={!props.can_edit}
				/>
		</div>
	);
};

const mapStateToProps = function(state) {
	return {
		summary_of_changes: state.plan.summary_of_changes,
		can_edit: deployment.canEdit(state)
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onChange: function(evt) {
			dispatch(actions.setSummary(evt.target.value));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(summary);
