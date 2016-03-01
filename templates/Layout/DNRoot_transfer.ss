<div class="content page-header">
    <div class="row">
        <div class="col-md-12">
			<% include Breadcrumb %>
        </div>
    </div>

</div>
<div class="content">
	<% with $CurrentTransfer %>
		<div class="row">
			<div class="col-md-12 environment-details">
				<a href="$Environment.Project.Link(snapshots)"><i class="fa fa-long-arrow-left"></i> Back to snapshots</a>
			</div>
		</div>

		<div class="deployment-status">
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
					<span class="jobstatus">$ResqueStatus.LowerCase</span>
				</div>
			</div>
		</div>

		<h5>Transfer log:</h5>
		<pre id="queue_log" class="log-content" data-loglink="$LogLink">$LogContent.XML</pre>
	<% end_with %>
</div>
