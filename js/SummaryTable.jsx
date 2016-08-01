
/**
 * @jsx React.DOM
 */
var SummaryTable = React.createClass({
	isEmpty: function(obj) {
		for (var key in obj) {
			if (obj.hasOwnProperty(key) && obj[key]) {
				return false;
			}
		}
		return true;
	},
	render: function() {
		var changes = this.props.changes;
		if(this.isEmpty(changes)) {
			return null;
		}
		var idx = 0;
		var summaryLines = Object.keys(changes).map(function(key) {
			idx++;

			var compareUrl = null;
			if(typeof changes[key].compareUrl != 'undefined') {
				compareUrl = changes[key].compareUrl;
			}

			if(typeof changes[key].description!=='undefined') {

				if (changes[key].description!=="") {
					return <DescriptionOnlySummaryLine key={idx} name={key} description={changes[key].description} compareUrl={compareUrl} />
				} else {
					return <UnchangedSummaryLine key={idx} name={key} value="" />
				}

			} else if(changes[key].from != changes[key].to) {
				return <SummaryLine key={idx} name={key} from={changes[key].from} to={changes[key].to} compareUrl={compareUrl} />
			} else if(typeof changes[key].from !== 'undefined') {
				return <UnchangedSummaryLine key={idx} name={key} value={changes[key].from} />
			}
		});

		return (
			<table className="table table-striped table-hover">
				<tbody>
					{summaryLines}
				</tbody>
			</table>
		);
	}
});

var SummaryLine = React.createClass({
	render: function() {
		var from = this.props.from,
			to = this.props.to;

		// naive git sha detection
		if(from !== null && from.length === 40) {
			from = from.substring(0,7);
		}

		// naive git sha detection
		if(to !== null && to.length === 40) {
			to = to.substring(0,7);
		}

		var compareUrl = null;
		if(this.props.compareUrl !== null) {
			compareUrl = <a target="_blank" href={this.props.compareUrl}>View diff</a>
		}

		return (
			<tr>
				<th scope="row">{this.props.name}</th>
				<td>{from}</td>
				<td><span className="glyphicon glyphicon-arrow-right" /></td>
				<td>{to}</td>
				<td className="changeAction">{compareUrl}</td>
			</tr>
		)
	}
});

var UnchangedSummaryLine = React.createClass({
	render: function() {
		var from = this.props.value;
		// naive git sha detection
		if(from !== null && from.length === 40) {
			from = from.substring(0,7);
		}

		return (
			<tr>
				<th scope="row">{this.props.name}</th>
				<td>{from}</td>
				<td>&nbsp;</td>
				<td><span className="label label-success">Unchanged</span></td>
				<td>&nbsp;</td>
			</tr>
		);
	}
});

var DescriptionOnlySummaryLine = React.createClass({
	render: function() {
		var compareColumn = null;
		var colSpan = "4";
		if(this.props.compareUrl !== null) {
			compareColumn = <td className="changeAction"><a target="_blank" href={this.props.compareUrl}>View diff</a></td>;
			colSpan = "3";
		}

		return (
			<tr>
				<th scope="row">{this.props.name}</th>
				<td colSpan={colSpan} dangerouslySetInnerHTML={{__html: this.props.description}} />
				{compareColumn}
			</tr>
		);
	}
});

module.exports = SummaryTable;
