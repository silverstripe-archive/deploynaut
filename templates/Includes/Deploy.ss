<% with Deployment %>
<h3>Deploying to <a href="$Environment.Project.Link">$Environment.Project.Name</a>:<a href="$Environment.Link">$Environment.Name</a></h3>
<div>Deploying <em>$SHA</em></div>

<h5>Status:</h5>
<pre id="deploy_action" class="$ResqueStatus">$ResqueStatus</pre>

<h5>Deploy log:</h5>
<pre id="deploy_log" data-loglink="$LogLink">$LogContent</pre>
<% end_with %>