<% with Transfer %>
<% if Direction == 'get' %>
	<h3>
		Backup $ModeNice from <a href="$Environment.Project.Link">$Environment.Project.Name</a>:<a href="$Environment.Link">$Environment.Name</a>
	</h3>
<% else %>
	<h3>
		Restore $ModeNice to <a href="$Environment.Project.Link">$Environment.Project.Name</a>:<a href="$Environment.Link">$Environment.Name</a>
	</h3>
<% end_if %>


<h5>Status:</h5>
<pre id="queue_action" class="$ResqueStatus">$ResqueStatus</pre>

<h5>Deploy log:</h5>
<pre id="queue_log" data-loglink="$LogLink">$LogContent</pre>
<% end_with %>