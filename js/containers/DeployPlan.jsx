const React = require('react');
const ReactRedux = require('react-redux');

const SummaryOfChanges = require('./SummaryOfChanges.jsx');
const DeployDiff = require('../components/DeployDiff.jsx');
const SaveDeployPlan = require('./buttons/SaveDeployPlan.jsx');
const Messages = require('../components/Messages.jsx');

const actions = require('../_actions.js');

function DeployPlan(props) {
	// don't show the rest of the form if there is an error in the deploy plan
	if (props.validation_code === 'error') {
		return (
			<div>
				<div className="section">
					<Messages messages={props.messages} />
				</div>
			</div>
		);
	}

	return (
		<div>
			<div className="section">
				<Messages messages={props.messages} />
				<header id="1">Deployment plan</header>
				<p>
					Provide context for the approver or add details for future
					reference with a summary of changes.
			</p>
				<div>
					<div className="row">
						<div className="col-md-8">
							<div className="form-group">
								<label htmlFor="deploy_title">Deployment name or meaningful title</label>
								<input
									type="text"
									className="form-control"
									id="deploy_title"
									value={props.title}
									onChange={props.onTitleChange}
								/>
							</div>
							<SummaryOfChanges />
						</div>
						<div className="col-md-4 text-muted">
							<i className="fa fa-lg fa-lightbulb-o" aria-hidden="true"></i> You might want to include:
							<ul>
								<li>Scope of work</li>
								<li>Release plan and schedule</li>
								<li>Supporting resources (e.g. docs)</li>
								<li>Support and contingency plan</li>
								<li>Anticipated deployment date</li>
								<li>Implementation team</li>
							</ul>
						</div>
					</div>
					<DeployDiff changes={props.changes} />
				</div>
			</div>
			<SaveDeployPlan />
		</div>
	);
}

const mapStateToProps = function(state) {
	return {
		validation_code: state.plan.validation_code,
		changes: state.plan.changes,
		title: state.plan.title,
		messages: state.plan.messages
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onTitleChange: function(evt) {
			dispatch(actions.setTitle(evt.target.value));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(DeployPlan);

