var React = require('react');
var ReactRedux = require('react-redux');
var actions = require('../_actions.js');

var CurrentBuildStatus = function(props) {
	var shortSha = "";
	if (typeof props.build.SHA === 'string') {
		shortSha = props.build.SHA.substring(0,7);
	}

	return (
		<div className="current-build">
			<div className="details">
				<a className="branch-detail" href={props.build.CommitURL}>{props.build.Branch} <span className="sha-detail" title={props.build.SHA}>{shortSha}</span></a>
				<span className="deployed-detail">Deployed {props.build.CreatedDate}</span>
			</div>
			<ul className="actions">
				<li><a className="repo-action" href={props.build.CommitURL}><i className="fa fa-github-alt"></i></a></li>
				<li><a className="info-action" href="#"><i className="fa fa-info-circle"></i></a></li>
			</ul>
		</div>
	);
};

const mapStateToProps = function(state) {
	return {
		build: state.currentbuild.build
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(CurrentBuildStatus);
