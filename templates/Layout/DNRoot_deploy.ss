<% if $Deployment %>
	<% with $Deployment %>
        <h3>Deploying to <a href="$Environment.Project.Link">$Environment.Project.Name</a>:<a href="$Environment.Link">$Environment.Name</a></h3>
        <div>Deploying <em>$SHA</em></div>

        <h5>Status:</h5>
        <div class="progress deployment-progress">
            <div class="progress-bar
            	<% if $ResqueStatus == 'Started' || $ResqueStatus == 'Running' %>
            		progress-bar-striped active
				<% end_if %>
				$ResqueStatus" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" id="queue_action">

				Deploying to $Environment.Name
            	<span class="status">$ResqueStatus</span>
			</div>
		</div>


        <h5>Deploy log:</h5>
        <pre id="queue_log" class="log-content" data-loglink="$LogLink">$LogContent</pre>
	<% end_with %>
<% end_if %>