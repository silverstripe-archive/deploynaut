var React = require('react');
var ReactRedux = require('react-redux');

var RadioList = require('../components/RadioList.jsx');
var Dropdown = require('../components/Dropdown.jsx');

var git = require('../actions/git.js');
var plan = require('../actions/plan.js');

function ShaSelector(props) {

	var dropdown = null;

	if(props.typeSelected !== "") {
		dropdown = (
			<Dropdown
				onSelect={props.onRefSelect}
				options={props.refList}
				value={props.refSelected}
				disabled={props.disabled}
				name="ref_selector"
			/>
		);
	}

	return (
		<div>
			<RadioList
				options={props.types}
				value={props.typeSelected}
				onRadioClick={props.onRadioClick}
				disabled={props.disabled}
			/>
			{dropdown}
		</div>
	);
}

ShaSelector.propTypes = {
	types: React.PropTypes.array.isRequired,
	typeSelected:  React.PropTypes.oneOfType([
		React.PropTypes.string,
		React.PropTypes.number
	]).isRequired,
	refList: React.PropTypes.array.isRequired,
	refSelected: React.PropTypes.oneOfType([
		React.PropTypes.string,
		React.PropTypes.number
	]).isRequired,
	disabled: React.PropTypes.bool.isRequired
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
	var refs = [];
	if(state.git.list[state.git.selected_type]) {
		refs = state.git.list[state.git.selected_type].list;
	}

	return {
		types: state.git.list,
		typeSelected: state.git.selected_type,
		refList: refs,
		refSelected: state.git.selected_ref,
		disabled: isDisabled(state)
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onRadioClick: function(id) {
			dispatch(git.setGitRefType(id));
		},
		onRefSelect: function(ref) {
			dispatch(git.setGitRef(ref));
			dispatch(plan.getDeploySummary(ref));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(ShaSelector);
