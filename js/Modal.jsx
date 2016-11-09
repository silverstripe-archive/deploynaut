var React = require("react");

var Modal = React.createClass({
	propTypes: {
		show: React.PropTypes.bool,
		keyboard: React.PropTypes.bool,
		closeHandler: React.PropTypes.func,
		className: React.PropTypes.string,
		closeTitle: React.PropTypes.string,
		options: React.PropTypes.array
	},

	getDefaultProps: function() {
		return {
			show: true,
			keyboard: true,
			closeTitle: "&times;"
		};
	},

	componentDidMount: function() {
		this.modal({show: this.props.show, keyboard: this.props.keyboard});
	},

	componentWillReceiveProps: function(props) {
		this.modal({show: props.show, keyboard: props.keyboard});
	},

	componentWillUnmount: function() {
		this.modal('hide');
		$('body').removeClass('modal-open');
		$('.modal-backdrop').remove();
	},

	getCloseTitle: function() {
		return {__html: this.props.closeTitle};
	},

	modal: function(options) {
		var selector = $(this.selector);
		selector.modal(options);
		selector.on('hidden.bs.modal', function() {
			this.props.closeHandler();
		}.bind(this));
	},

	selector: null,

	render: function() {
		// tabIndex -1 fixes esc key not working. See http://stackoverflow.com/questions/12630156

		let classNames = 'modal fade';
		if (this.props.className) {
			classNames += ' ' + this.props.className;
		}

		let options = null;
		if (this.props.options && this.props.options.length) {
			options = (
				<li className="dropdown">
					<a data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" aria-label="Options">
						Options <i className="glyphicon glyphicon-menu-down"></i>
					</a>
					<ul className="dropdown-menu">
					{this.props.options.map(function(item) {
						let icon = null;
						if (item.icon !== "") {
							icon = (
								<i className={"icon " + item.icon} aria-hidden="true"></i>
							);
						}
						return (
							<li key={item.title}>
								<a href={"javascript:void(0);"} onClick={item.handler}>{icon}{item.title}</a>
							</li>
						);
					})}
					</ul>
				</li>
			);
		}

		return (
			<div className={classNames} ref={function(node) { this.selector = node; }.bind(this)}>
				<div className="modal-dialog modal-lg">
					<div className="modal-content">
						<div className="modal-header">
							<ul className="nav nav-tabs">
								{options}
								<li>
									<a className="close" data-dismiss="modal" aria-label="Close" dangerouslySetInnerHTML={this.getCloseTitle()} />
								</li>
							</ul>
							<h4 className="modal-title">{this.props.title}</h4>
						</div>
						<div className="modal-body">
							{this.props.children}
						</div>
					</div>
				</div>
			</div>
		);
	}
});

module.exports = Modal;
