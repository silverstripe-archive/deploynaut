var React = require('react');
var ReactRedux = require('react-redux');

var RadioList = require('../components/RadioList.jsx');
var Dropdown = require('../components/Dropdown.jsx');
var Button = require('../components/Button.jsx');

var actions = require('../_actions.js');

function GitRefSelector(props) {
	var dropdown = null;
	var shaInput = null;

	if (props.selected_type === 4) { // Deploy a specific SHA
		shaInput = (
			<fieldset>
				<input
					type="text"
					name="selected_ref"
					onChange={props.onShaChange}
					value={props.selected_ref}
				/>
				<Button
					onClick={() => props.onRefSelect(props.selected_ref)}
					value="Go"
				/>
			</fieldset>
		);
	} else if (props.selected_type !== "") {
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
				value={props.selected_type}
				onRadioClick={props.onRadioClick}
				disabled={props.disabled}
			/>
			{dropdown}
			{shaInput}
		</div>
	);
}

GitRefSelector.propTypes = {
	types: React.PropTypes.object.isRequired,
	selected_type: React.PropTypes.oneOfType([
		React.PropTypes.string,
		React.PropTypes.number
	]).isRequired,
	ref_list: React.PropTypes.array,
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
		selected_type: state.git.selected_type,
		ref_list: refs,
		selected_ref: state.git.selected_ref,
		disabled: isDisabled(state)
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onRadioClick: function(id, type) {
			dispatch(actions.setGitRefType(id));
			if (type.promote_build) {
				dispatch(actions.setGitRef(type.promote_build.sha));
				dispatch(actions.getDeploySummary(type.promote_build.sha));
			}
		},
		onRefSelect: function(ref) {
			dispatch(actions.setGitRef(ref));
			dispatch(actions.getDeploySummary(ref));
		},
		onShaChange: function(e) {
			dispatch(actions.setGitRef(e.target.value));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(GitRefSelector);
