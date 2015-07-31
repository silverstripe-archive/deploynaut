<div class="content page-header">
    <div class="row">
        <div class="col-md-12">
            <ol class="breadcrumb">
                <li><a href="naut/project/$CurrentProject.Name">$CurrentProject.Title</a></li>
                <li><a href="naut/project/$CurrentProject.Name/snapshots">Snapshots</a></li>
            </ol>
            <h1 class="page-heading">Create: $CurrentTransfer.Environment.Name</h1>
        </div>
    </div>

</div>
<div class="content">
	<% with $CurrentTransfer %>

		<div class="deployment-status">
			<h5>Status: $value</h5>
			<div class="progress deployment-progress">
				<div class="progress-bar
						<% if $ResqueStatus == 'Started' || $ResqueStatus == 'Running' %>
							progress-bar-striped active
						<% end_if %>
					$ResqueStatus" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" id="queue_action">

					<% if $Direction == 'get' %>
						 Backup $ModeNice from $Environment.Name
					<% else %>
						 Restore $ModeNice to $Environment.Name
					<% end_if %>
					<span class="status">$ResqueStatus</span>
				</div>
			</div>
        </div>

		<h5>Deploy log:</h5>
		<pre id="queue_log" class="log-content" data-loglink="$LogLink">$LogContent</pre>
	<% end_with %>
</div>
