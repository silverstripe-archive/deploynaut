var React = require("react");
var ReactDOM = require("react-dom");

var Modal = React.createClass({

	getInitialState: function() {
		return {
		};
	},

	componentDidMount: function() {
		this.modal({show: true, keyboard: true});
	},

	componentWillUnmount: function() {
		this.modal('hide');
	},

	modal: function(options) {
		$(ReactDOM.findDOMNode(this)).modal(options);
		$(ReactDOM.findDOMNode(this)).on('hidden.bs.modal', function() {
			this.props.closeHandler();
		}.bind(this));
	},

	render: function() {
		// tabIndex -1 fixes esc key not working
		// see http://stackoverflow.com/questions/12630156/how-do-you-enable-the-escape-key-close-functionality-in-a-twitter-bootstrap-moda
		return (
			<div className="modal fade" tabIndex="-1">
				<div className="modal-dialog modal-lg">
					<div className="modal-content">
						<div className="modal-header">
							<button type="button" className="close" data-dismiss="modal" aria-label="Close">
								<span aria-hidden="true">&times;</span>
							</button>
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
