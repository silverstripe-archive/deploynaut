var React = require('react');
var ReactRedux = require('react-redux');

var RadioList = require('../components/RadioList.jsx');
var Dropdown = require('../components/Dropdown.jsx');

var actions = require('../_actions.js');

function ShaSelector(props) {

	var dropdown = null;

	if(props.type_selected !== "") {
		dropdown = (
			<Dropdown
				onSelect={props.onRefSelect}
				options={props.refList}
				value={props.refSelected}
				disabled={props.requestSent}
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
				disabled={props.requestSent}
			/>
			{dropdown}
		</div>
	);
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
		requestSent: state.approval.request_sent
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onRadioClick: function(id) {
			dispatch(actions.setGitRefType(id));
		},
		onRefSelect: function(ref) {
			dispatch(actions.setGitRef(ref));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(ShaSelector);
