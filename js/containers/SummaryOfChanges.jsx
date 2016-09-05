var React = require('react');
var ReactRedux = require('react-redux');

var TextArea = require('../components/TextArea.jsx');
var plan = require('../actions/plan.js');

var summary = function(props) {
	return (
		<div className="row">
			<div className="col-md-8">
				<p>
					Provide context for the approver or add details for future
					reference with a summary of changes.
				</p>
				<TextArea
					name="summary"
					value={props.summaryOfChanges}
					onChange={props.onChange}
					disabled={props.disabled}
				/>
			</div>
			<div className="col-md-4">
				<small>
				<i className="fa fa-lightbulb-o" aria-hidden="true"></i> You might want to include:
				<ul>
					<li>Scope of work</li>
					<li>Release plan and scheul</li>
					<li>Supporting resources (e.g. docs)</li>
					<li>Support and contingency plan</li>
					<li>Anticipated deployment date</li>
					<li>Implementation team</li>
				</ul>
				</small>
			</div>
		</div>
	);
};

function isDisabled(state) {
	if(state.approval.request_sent) {
		return true;
	}
	if(state.approval.approved) {
		return true;
	}
	if(state.approval.bypassed) {
		return true;
	}
	if(state.deployment.enqueued) {
		return true;
	}
	return false;
}

const mapStateToProps = function(state) {
	return {
		summaryOfChanges: state.plan.summary_of_changes,
		disabled: isDisabled(state)
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onChange: function(evt) {
			dispatch(plan.setSummary(evt.target.value));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(summary);
