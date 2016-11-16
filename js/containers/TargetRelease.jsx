const React = require('react');
const ReactRedux = require('react-redux');

const Radio = require('../components/Radio.jsx');
const Checkbox = require('../components/Checkbox.jsx');
const Dropdown = require('../components/Dropdown.jsx');
const BuildStatus = require('../components/BuildStatus.jsx');
const ButtonGitUpdate = require('./buttons/GitUpdate.jsx');
const SaveTargetRelease = require('./buttons/SaveTargetRelease.jsx');

const actions = require('../_actions.js');
const constants = require('../constants/deployment.js');

const TargetRelease = React.createClass({
	getInitialState: function() {
		return {
			options_open: false
		};
	},

	toggleOptionsOpen: function() {
		this.setState({
			options_open: !this.state.options_open
		});
	},

	render: function() {
		const props = this.props;
		const typeFields = {};

		Object.keys(props.types).forEach(function(key) {
			switch (key) {
				case '0': // Promote build option
					typeFields[key] = (
						<BuildStatus status_box status_ago deployment={props.types[key].promote_build} />
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
						<input
							className="field text"
							type="text"
							name="selected_ref"
							onChange={props.onShaChange}
							value={props.selected_ref}
							disabled={props.disabled}
						/>
					);
					break;
				default:
					break;
			}
		});

		const list = Object.keys(props.types).map(function(key, index) {
			let extraFields = null;
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

		let options_classes = 'checkbox-list';
		let caret = 'up';
		if (!this.state.options_open) {
			options_classes += ' hide';
			caret = 'down';
		}

		let options_toggle = null;
		if (list && list.length > 0) {
			options_toggle = (
				<a href={"javascript:void(0);"} onClick={this.toggleOptionsOpen}>
					Deploy options <i className={"fa fa-caret-" + caret}></i>
				</a>
			);
		}

		return (
			<div>
				{this.props.last_fetched_date && <div className="fetch">
					<div className="pull-right">
						<ButtonGitUpdate />
					</div>
					<div>
						<i className="fa fa-code" aria-hidden="true"></i> Last synced {this.props.last_fetched_date}
						&nbsp;<span className="small">{this.props.last_fetched_ago}</span>
					</div>
					<div><i>Ensure you have the most recent code before setting up your deployment</i></div>
				</div>}

				<div className="section target-release">
					<header id="0">Target release</header>
					<div>
						Select the release you would like to deploy to {props.environment_name}
					</div>
					<form className="form">
						<ul className="radio-list">
							{list}
						</ul>
						{options_toggle}
						<ul className={options_classes}>
							{props.options.map(function(option, index) {
								return (
									<li key={index}>
										<Checkbox
											description={option.title}
											name="option"
											checked={props.selected_options[option.name] === true}
											id={index}
											onClick={() => props.onCheckboxClick(option.name)}
											disabled={props.disabled}
										/>
									</li>
								);
							})}
						</ul>
					</form>
				</div>
				<SaveTargetRelease />
			</div>
		);
	}
});

TargetRelease.propTypes = {
	types: React.PropTypes.object.isRequired,
	selected_type: React.PropTypes.oneOfType([
		React.PropTypes.string,
		React.PropTypes.number
	]).isRequired,
	options: React.PropTypes.array,
	selected_options: React.PropTypes.object,
	ref_list: React.PropTypes.array,
	selected_ref: React.PropTypes.oneOfType([
		React.PropTypes.string,
		React.PropTypes.number
	]).isRequired,
	disabled: React.PropTypes.bool.isRequired
};

function isDisabled(state) {
	if (isLoading(state) || state.plan.is_loading) {
		return true;
	}
	const current = state.deployment.list[state.deployment.current_id] || {};
	if (constants.isSubmitted(current.state)) {
		return true;
	}
	if (constants.isApproved(current.state)) {
		return true;
	}
	if (constants.isRejected(current.state)) {
		return true;
	}
	if (constants.isQueued(current.state)) {
		return true;
	}
	return false;
}

const mapStateToProps = function(state) {
	let refs = [];
	if (state.git.list[state.git.selected_type]) {
		refs = state.git.list[state.git.selected_type].list;
	}

	return {
		environment_name: state.environment.name,
		types: state.git.list,
		selected_type: state.git.selected_type,
		options: state.git.options,
		selected_options: state.git.selected_options,
		ref_list: refs,
		selected_ref: state.git.selected_ref,
		last_fetched_date: state.git.last_fetched_date,
		last_fetched_ago: state.git.last_fetched_ago,
		disabled: isDisabled(state)
	};
};

const mapDispatchToProps = function(dispatch) {
	return {
		onRadioClick: function(id, type) {
			dispatch(actions.setGitRefType(id));
			if (type.promote_build) {
				dispatch(actions.setGitRef(type.promote_build.sha));
			}
		},
		onCheckboxClick: function(name) {
			dispatch(actions.toggleOption(name));
		},
		onRefSelect: function(ref) {
			dispatch(actions.setGitRef(ref));
		},
		onShaChange: function(e) {
			dispatch(actions.setGitRef(e.target.value));
		}
	};
};

module.exports = ReactRedux.connect(mapStateToProps, mapDispatchToProps)(TargetRelease);
