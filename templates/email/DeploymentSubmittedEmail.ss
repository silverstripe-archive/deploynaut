<p>Hi $Approver.FirstName,</p>

<p>We're just letting you know that {$Deployer.Name} has submitted a <a href="$Link">deployment to $Environment.FullName</a> for your approval.</p>

<p>Summary of changes:</p>

<p>$Title</p>
<p>$Summary</p>

<table>
	<tbody>
		<tr>
			<td>Requested by</td>
			<td><a href="mailto:{$Deployer.Email}">$Deployer.Name</a></td>
			<td colspan="3">&nbsp;</td>
		</tr>
		<% loop $Changes %>
			<% if $Changed || $Description %>
			<tr>
				<td>$Name</td>
				<% if $Description %>
					<td colspan="4">$Description</td>
				<% else %>
					<td>$From</th>
					<td>&rarr;</td>
					<td>$To</td>
					<td><% if $CompareUrl %><a href="$CompareUrl">View diff<i className="fa fa-external-link-square superscript"></i></a><% else %>&nbsp;<% end_if %></td>
				<% end_if %>
			</tr>
			<% end_if %>
		<% end_loop %>
	</tbody>
</table>

<p>If you have questions, please reply to this email to discuss directly with {$Deployer.FirstName}.</p>

<p>Kind regards,<br>
SilverStripe Platform team</p>
