var React = require('react');
var ReactRedux = require('react-redux');
var actions = require('../_actions.js');

var CurrentBuildStatus = function(props) {
	return (
		<div>
			<a href={props.build.CommitURL}>{props.build.Branch} {props.build.SHA}</a>
			<span>Deployed {props.build.CreatedDate}</span>
			<a href={props.build.CommitURL}><i className="fa fa-github-alt"></i></a>
			<a href="#"><i className="fa fa-info-circle"></i></a>
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
