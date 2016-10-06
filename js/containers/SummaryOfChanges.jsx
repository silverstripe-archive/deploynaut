var React = require('react');
var ReactRedux = require('react-redux');

var TextArea = require('../components/TextArea.jsx');
var actions = require('../_actions.js');

var summary = function(props) {
	return (

		<div className="form-group">
			<label htmlFor="summary">Description:</label>
				<TextArea
					name="summary"
					value={props.summary_of_changes}
					onChange={props.onChange}
					disabled={props.disabled}
				/>
		</div>
	);
};

function isDisabled(state) {
	if (state.deployment.submitted) {
		return true;
	}
	if (state.deployment.approved) {
		return true;
	}
	if (state.deployment.queued) {
		return true;
	}
	return false;
}

const mapStateToProps = function(state) {
	return {
		summary_of_changes: state.plan.summary_of_changes,
		disabled: isDisabled(state)
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
