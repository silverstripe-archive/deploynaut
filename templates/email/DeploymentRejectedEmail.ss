<p>Hi $Deployer.FirstName,</p>

<p>Unfortunately {$Approver.Name} has rejected your <a href="$Link">deployment to $Environment.FullName</a>.</p>

<% if $RejectedReason %>
	<p>The reason specified:</p>
	<p>$RejectedReason</p>
<% end_if %>

<p>Please reply to this email to discuss directly with {$Approver.FirstName}.</p>

<p>Kind regards,<br>
SilverStripe Platform team</p>
