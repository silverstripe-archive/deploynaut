<h2>$Project.Title</h2>

<% if $CurrentProject %>
<ul class="nav nav-tabs">
	<% loop $CurrentProject.Menu %>
	<li<% if $IsActive %> class="active"<% end_if %>><a href="$Link">$Title</a></li>
	<% end_loop %>
</ul>
<ul class="nav level-2">
	<% if $Project.canBackup %>
	<li><a href="$CurrentProject.Link('createsnapshot')">Create Snapshot</a></li>
	<% end_if %>
	<% if $Project.canUploadArchive %>
	<li><a href="$CurrentProject.Link('uploadsnapshot')">Upload Snapshot</a></li>
	<% end_if %>
	<li><a href="$CurrentProject.Link('snapshotslog')">Log</a></li>
</ul>
<% end_if %>

<% with $CurrentProject %>
<% if $HasDiskQuota %>
	<% if $HasExceededDiskQuota %>
		<p class="message bad">You have exceeded the total quota of $DiskQuotaMB MB. You will need to delete old snapshots in order to create new ones.</p>
	<% else %>
		<p class="message good">You have used $UsedQuotaMB MB out of total quota $DiskQuotaMB MB quota across all environments for this project.</p>
	<% end_if %>
<% end_if %>
<% end_with %>

<% include CompleteArchiveList %>

<% include PendingArchiveList %>

<% include SnapshotImportInstructions %>
