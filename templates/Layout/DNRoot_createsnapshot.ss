<h2>$Project.Title</h2>

<% if $CurrentProject %>
<ul class="nav nav-tabs">
	<% loop $CurrentProject.Menu %>
	<li<% if $IsActive %> class="active"<% end_if %>><a href="$Link">$Title</a></li>
	<% end_loop %>
</ul>
<ul class="nav level-2">
	<% if $Project.canBackup %>
	<li class="active"><a href="$CurrentProject.Link('createsnapshot')">Create Snapshot</a></li>
	<% end_if %>
	<% if $Project.canUploadArchive %>
	<li><a href="$CurrentProject.Link('uploadsnapshot')">Upload Snapshot</a></li>
	<% end_if %>
	<li><a href="$CurrentProject.Link('snapshotslog')">Log</a></li>
</ul>
<% end_if %>

<h3>$Title</h3>

<p>Back up the database and/or assets into a file and transfer it to deploynaut. From there it can be 
downloaded or used for later restores</p>

<% with $DataTransferForm %>
<form $FormAttributes class='form-inline'>
	<% loop VisibleFields %>$FieldHolder<% end_loop %>
	$Actions
	$HiddenFields
</form>
<% end_with %>
