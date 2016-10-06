const React = require('react');
const ReactRedux = require('react-redux');
const Pagination = require('react-bootstrap/lib/Pagination');
const BuildStatus = require('../components/BuildStatus.jsx');

const _ = require('underscore');
const actions = require('../_actions.js');
const deployStates = require('../constants/deployment.js');

const DeployHistory = function(props) {
	let errorRow = null;
	let pagination = null;

	if (props.error) {
		errorRow = (
			<tr className="danger">
				<td colSpan="5">
					{props.error}
				</td>
			</tr>
		);
	}

	if (props.total_pages > 1) {
		pagination = (
			<div className="text-center">
				<nav>
					<Pagination
						prev
						next
						items={props.total_pages}
						activePage={props.current_page}
						onSelect={props.onPageClick}
					/>
				</nav>
			</div>
		);
	}

	return (
		<div>
			<h4>History</h4>
			<div className="table-responsive">
				<table className="table table-clickable table-centered-columns table-striped table-hover">
					<thead>
						<tr>
							<th>Deploy date</th>
							<th>Build details</th>
							<th>Approval</th>
							<th>Deployed by</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{errorRow}
						{
							Object.keys(props.list).map(function(i) {
								const row = props.list[i];
								return (
									<tr className={row.is_current_build ? "current" : ""} onClick={() => props.onItemClick(row.id)} key={i}>
										<td>{row.date_started_nice}</td>
										<td><BuildStatus deployment={row} /></td>
										<td>{row.approver ? row.approver.name : <span className="bypassed">Bypassed</span>}</td>
										<td>{row.deployer ? row.deployer.name : null}</td>
										<td className={"deploy-status status-" + row.state}><span className="deploy-status-text">{row.state}</span></td>
									</tr>
								);
							})
						}
					</tbody>
				</table>
			</div>
			{pagination}
		</div>
	);
};

const mapStateToProps = function(state) {

	// try to find the current build in the list of all deployments
	let historyList = {};
	let numDeployments = 0;
	if (typeof state.deployment.list === "object") {
		historyList = _.filter(state.deployment.list, function(deploy) {
			switch (deploy.state) {
				case deployStates.STATE_COMPLETED:
				case deployStates.STATE_INVALID:
				case deployStates.STATE_FAILED:
					numDeployments += 1;
					return true;
				default:
					return false;
			}
		});
	}
	historyList.sort(function(a, b) {
		return Date.parse(b.date_started) - Date.parse(a.date_started);
	});

	const perPage = 4;
	// only show paginated result, recalc
	const start = (state.deployment.current_page - 1) * perPage;
	const end = start + perPage;
	const totalPages = Math.ceil(numDeployments / perPage);

	const paginatedList = {};
	let pos = 0;
	Object.keys(historyList).forEach(function(key) {
		if (pos >= start && pos < end) {
			paginatedList[key] = historyList[key];
		}
		pos++;
	});

	return {
		list: paginatedList,
		page_length: perPage,
		total_pages: totalPages,
		current_page: state.deployment.current_page,
		error: state.deployment.error
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onItemClick: function(id) {
			actions.history.push('/deployment/' + id.toString());
		},
		onPageClick: function(page) {
			dispatch(actions.setDeployHistoryPage(page));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(DeployHistory);
