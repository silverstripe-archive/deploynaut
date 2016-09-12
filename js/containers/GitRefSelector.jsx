var React = require('react');
var ReactRedux = require('react-redux');

var RadioList = require('../components/RadioList.jsx');
var Dropdown = require('../components/Dropdown.jsx');

var actions = require('../_actions.js');

function GitRefSelector(props) {
	var dropdown = null;

	if (props.type_selected !== "") {
		dropdown = (
			<Dropdown
				onSelect={props.onRefSelect}
				options={props.ref_list}
				value={props.selected_ref}
				disabled={props.disabled}
				name="ref_selector"
			/>
		);
	}

	return (
		<div>
			<RadioList
				options={props.types}
				value={props.type_selected}
				onRadioClick={props.onRadioClick}
				disabled={props.disabled}
			/>
			{dropdown}
		</div>
	);
}

GitRefSelector.propTypes = {
	types: React.PropTypes.array.isRequired,
	type_selected: React.PropTypes.oneOfType([
		React.PropTypes.string,
		React.PropTypes.number
	]).isRequired,
	ref_list: React.PropTypes.array.isRequired,
	selected_ref: React.PropTypes.oneOfType([
		React.PropTypes.string,
		React.PropTypes.number
	]).isRequired,
	disabled: React.PropTypes.bool.isRequired
};

function isDisabled(state) {
	if (state.approval.request_sent) {
		return true;
	}
	if (state.approval.approved) {
		return true;
	}
	if (state.approval.bypassed) {
		return true;
	}
	if (state.deployment.enqueued) {
		return true;
	}
	return false;
}

const mapStateToProps = function(state) {
	var refs = [];
	if (state.git.list[state.git.selected_type]) {
		refs = state.git.list[state.git.selected_type].list;
	}

	return {
		types: state.git.list,
		type_selected: state.git.selected_type,
		ref_list: refs,
		selected_ref: state.git.selected_ref,
		disabled: isDisabled(state)
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onRadioClick: function(id) {
			dispatch(actions.setGitRefType(id));
		},
		onRefSelect: function(ref) {
			dispatch(actions.setGitRef(ref));
			dispatch(actions.getDeploySummary(ref));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(GitRefSelector);
