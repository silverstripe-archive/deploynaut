<div class="content page-header">
	<div class="row">
		<div class="col-md-9">
			<% include Breadcrumb %>
			<% if $CurrentProject %>
			<ul class="nav nav-tabs">
				<li class="active"><a href="$CurrentProject.Link('snapshots')">Overview</a></li>

				<% if $CurrentProject.canBackup %>
					<li><a href="$CurrentProject.Link('createsnapshot')">Create snapshot</a></li>
				<% end_if %>
				<% if $CurrentProject.canUploadArchive %>
					<li><a href="$CurrentProject.Link('uploadsnapshot')">Upload snapshot</a></li>
				<% end_if %>
				<li><a href="$CurrentProject.Link('snapshotslog')">Log</a></li>
			</ul>
			<% end_if %>
		</div>
	</div>
</div>

<div class="content">
	<% with $CurrentProject %>
		<% if $HasDiskQuota %>
			<% if $HasExceededDiskQuota %>
				<div class="disk-quota danger">
					<i class="fa fa-exclamation-circle"></i>
					The project has exceeded the total quota of $DiskQuotaMB MB. Delete old snapshots to free up space.
				</div>
			<% else_if $DiskQuotaUsagePercent > 85 %>
				<div class="disk-quota warning">
					<i class="fa fa-exclamation-triangle"></i>
					You have used $UsedQuotaMB MB out of your $DiskQuotaMB MB quota across all environments for this project.
				</div>
			<% else %>
				<div class="disk-quota success">
					<i class="fa fa-info-circle"></i>
					You have used $UsedQuotaMB MB out of your $DiskQuotaMB MB quota across all environments for this project.
				</div>
			<% end_if %>
		<% end_if %>
	<% end_with %>

	<% include CompleteArchiveList %>

	<% include PendingArchiveList %>

</div>
