<p>Hi $Deployer.FirstName,</p>

<p>Unfortunately $Approver.Name has rejected <a href="$Link">your deployment</a> to the <b>$Environment.Name</b> environment of <a href="$Environment.Project.Link">$Environment.Project.Name</a>.</p>

<% if $RejectedReason %>
	<p>The reason specified:</p>
	<p>$RejectedReason</p>
<% end_if %>

<p>Kind regards,<br>
$PlatformTitle team</p>
