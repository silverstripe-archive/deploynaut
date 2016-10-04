var React = require('react');
var ReactRedux = require('react-redux');

const SummaryOfChanges = require('./SummaryOfChanges.jsx');
var DeployDiff = require('../components/DeployDiff.jsx');

function DeployPlan(props) {
	return (
		<div className="section">
			<header id="1">Deployment Plan</header>
			<p>
				Provide context for the approver or add details for future
				reference with a summary of changes.
			</p>

			<div className="row">
				<div className="col-md-8">
					<div className="form-group">
						<label htmlFor="exampleInputEmail1">Deployment name or meaningful title</label>
						<input type="text" className="form-control" id="exampleInputEmail1" />
					</div>
					<SummaryOfChanges />
				</div>
				<div className="col-md-4">
					<small>
						<i className="fa fa-lightbulb-o" aria-hidden="true"></i> You might want to include:
						<ul>
							<li>Scope of work</li>
							<li>Release plan and schedule</li>
							<li>Supporting resources (e.g. docs)</li>
							<li>Support and contingency plan</li>
							<li>Anticipated deployment date</li>
							<li>Implementation team</li>
						</ul>
					</small>
				</div>
			</div>
			<DeployDiff changes={props.changes} is_loading={props.is_loading} />
		</div>
	);
}

const mapStateToProps = function(state) {
	return {
		changes: state.plan.changes,
		is_loading: state.plan.is_loading
	};
};

const mapDispatchToProps = function() {
	return {};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(DeployPlan);

