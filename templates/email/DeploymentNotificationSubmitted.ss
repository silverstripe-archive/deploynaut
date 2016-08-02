<p>Hi $Approver.FirstName,</p>

<p>We're just letting you know that a <a href="$Link">deployment to $Environment.FullName</a> has been submitted.</p>

<p>Summary of changes:</p>

<p>$Summary.XML</p>

<table>
	<tbody>
		<tr>
			<td>Requested by</td>
			<td><a href="mailto:{$Deployer.Email}">$Deployer.Name</a></td>
		</tr>
		<tr>
			<td>Expected deployment time</td>
			<td>$DatePlanned.Format("jS F Y H:s")</td>
		</tr>
		<% loop $Changes %>
			<tr>
				<td>$Name</td>
				<% if $Description %>
					<td colspan="4">$Description</td>
				<% else %>
					<td>$From</th>
					<td><% if $Changed %>&rarr;<% else %>&nbsp;<% end_if %></td>
					<td><% if $Changed %>$To<% else %>Unchanged<% end_if %></td>
					<td><% if $CompareUrl %><a href="$CompareUrl">View diff</a><% else %>&nbsp;<% end_if %></td>
				<% end_if %>
			</tr>
		<% end_loop %>
	</tbody>
</table>

<p>If you have questions, please reply to this email to discuss directly with $Deployer.FirstName.</p>

<p>Kind regards,<br>
SilverStripe Platform Team</p>
