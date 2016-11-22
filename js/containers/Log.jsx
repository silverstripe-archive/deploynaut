const React = require('react');

const Log = React.createClass({

	componentDidMount: function() {
		// for the first render
		this.scrollToBottom();
	},

	componentDidUpdate: function() {
		if (this.autoScroll) {
			this.scrollToBottom();
			// we have to re-enable autoscroll because we have programmatically triggered a scroll event
			this.autoScroll = true;
		}
	},

	componentWillUnmount: function() {
		this.teardownOnScroll();
	},

	setupOnScroll: function() {
		$(this.el).on('scroll', function() {
			// if we are scrolled to the bottom then autoScroll should be on otherwise we've scrolled somewhere else
			// and we shouldn't move the scroll any more
			if ($(this.el).scrollTop() >= ($(this.el)[0].scrollHeight - $(this.el).innerHeight())) {
				this.autoScroll = true;
			} else {
				this.autoScroll = false;
			}
		}.bind(this));
	},

	el: null,

	autoScroll: true,

	contentMounted: function(el) {
		this.el = el;
		this.setupOnScroll();
	},

	teardownOnScroll: function() {
		$(this.el).off('scroll');
	},

	scrollToBottom: function() {
		if ($(this.el).length > 0) {
			$(this.el).scrollTop($(this.el)[0].scrollHeight);
		}
	},

	render: function() {
		if (this.props.content.length === 0) {
			return <div className="alert alert-warning">No log events could be found</div>;
		}

		const lines = Object.keys(this.props.content).map(function(key) {
			return <div key={key}>{this.props.content[key]}</div>;
		}.bind(this));

		return (
			<div className="log-container">
				<div className="log-header">Deployment log</div>
				<pre
					className="log-content fade-in"
					ref={this.contentMounted}
				>
					{lines}
				</pre>
			</div>
		);
	}
});

module.exports = Log;
