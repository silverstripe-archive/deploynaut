<div class="content page-header">

	<% include PageHeader ShowEnvironmentList=false %>

	<% if $CurrentProject %>
	<ul class="nav nav-tabs">
		<li class="active"><a href="#">Overview</a></li>

		<% if $CurrentProject.canBackup %>
		<li><a href="$CurrentProject.Link('createsnapshot')">Create Snapshot</a></li>
		<% end_if %>
		<% if $CurrentProject.canUploadArchive %>
		<li><a href="$CurrentProject.Link('uploadsnapshot')">Upload Snapshot</a></li>
		<% end_if %>
		<li><a href="$CurrentProject.Link('snapshotslog')">Log</a></li>
	</ul>
	<% end_if %>
</div>

<div class="content">
	<% with $CurrentProject %>
	<% if $HasDiskQuota %>
		<% if $HasExceededDiskQuota %>
			<p class="alert alert-danger">You have exceeded the total quota of $DiskQuotaMB MB. You will need to delete old snapshots in order to create new ones.</p>
		<% else %>
			<p class="alert alert-special">You have used $UsedQuotaMB MB out of total quota $DiskQuotaMB MB quota across all environments for this project.</p>
		<% end_if %>
	<% end_if %>
	<% end_with %>

	<% include CompleteArchiveList %>

	<% include PendingArchiveList %>

	<% include SnapshotImportInstructions %>
</div>
