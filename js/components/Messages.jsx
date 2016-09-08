var React = require("react");

function Message(props) {
	if (!props.message) {
		return null;
	}
	var message = null;
	if (typeof props.message === 'object') {
		message = Object.keys(props.message).map(function(key) {
			return <div key={key}>{props.message[key]}</div>;
		});
	} else {
		message = props.message;
	}
	return (
		<div className={"alert alert-" + props.type} dangerouslySetInnerHTML={{__html: message}}></div>
	);
}

function Messages(props) {
	if (!props.messages.length) {
		return null;
	}
	var messages = props.messages.map(function(msg, index) {
		return <Message key={index} message={msg.text} type={msg.code} />;
	});
	return (
		<div>
			{messages}
		</div>
	);
}

module.exports = Messages;
