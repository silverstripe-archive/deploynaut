var React = require('react');
var ReactRedux = require('react-redux');

var Radio = require('../components/Radio.jsx');
var Dropdown = require('../components/Dropdown.jsx');
var Button = require('../components/Button.jsx');
var BuildStatus = require('../components/BuildStatus.jsx');

var actions = require('../_actions.js');

function GitRefSelector(props) {
	var typeFields = {};
	Object.keys(props.types).forEach(function(key) {
		switch (key) {
			case '0': // Promote build option
				typeFields[key] = (
					<BuildStatus deployment={props.types[key].promote_build} />
				);
				break;
			case '1': // Dropdowns for branch, tags, previously released
			case '2':
			case '3':
				typeFields[key] = (
					<Dropdown
						onSelect={props.onRefSelect}
						options={props.ref_list}
						value={props.selected_ref}
						disabled={props.disabled}
						name={"ref_selector_" + key}
					/>
				);
				break;
			case '4': // Input SHA option
				typeFields[key] = (
					<fieldset>
						<input
							type="text"
							name="selected_ref"
							onChange={props.onShaChange}
							value={props.selected_ref}
							disabled={props.disabled}
						/>
						<Button
							onClick={() => props.onRefSelect(props.selected_ref)}
							disabled={props.disabled}
							value="Go"
						/>
					</fieldset>
				);
				break;
			default:
				break;
		}
	});

	var list = Object.keys(props.types).map(function(key, index) {
		var extraFields = null;
		if (props.selected_type === props.types[key].id) {
			extraFields = typeFields[props.types[key].id];
		}
		return (
			<li key={props.types[key].id}>
				<Radio
					description={props.types[key].description}
					name="type"
					checked={props.selected_type === props.types[key].id}
					id={index}
					onClick={() => props.onRadioClick(props.types[key].id, props.types[key])}
					disabled={props.disabled}
				/>
				{extraFields}
			</li>
		);
	});

	return (
		<div>
			<form className="form">
				<ul className="radio-list">
					{list}
				</ul>
			</form>
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
