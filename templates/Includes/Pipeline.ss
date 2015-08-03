<% with $Pipeline %>
	<h3>Running Pipeline on <a href="$Environment.Project.Link">$CurrentEnvironment.Project.Name</a>:<a href="$CurrentEnvironment.Link">$Environment.Name</a></h3>

	<h5>Status:</h5>
	<pre id="queue_action" class="$Status">$Status</pre>

	<h5>Pipeline log:</h5>
	<pre id="queue_log" data-loglink="$LogLink">$LogContent</pre>
<% end_with %>