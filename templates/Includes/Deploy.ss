<% if $Deployment %>
	<% with $Deployment %>
		<h3>Deploying to <a href="$Environment.Project.Link">$Environment.Project.Name</a>:<a href="$Environment.Link">$Environment.Name</a></h3>
		<div>Deploying <em>$SHA</em></div>

		<h5>Status:</h5>
		<pre id="queue_action" class="alert $ResqueStatus">$ResqueStatus</pre>

		<h5>Deploy log:</h5>
		<pre id="queue_log" data-loglink="$LogLink">$LogContent.XML</pre>
	<% end_with %>
<% end_if %>
