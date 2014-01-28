<h2>$Project.Title</h2>

<h3>$Title</h3>

<p>Back up the database and/or assets into a file and transfer it to deploynaut. From there it can be 
downloaded or used for later restores</p>

<div class="button-nav">
	<ul class="nav nav-pills pull-right">
		<% if $Project.canBackup %>
		    <li class="active"><a href="$CurrentProject.Link('createsnapshot')">Create Snapshot</a></li>
		<% end_if %>
		<!-- <li><a href="$CurrentProject.Link('uploadsnapshot')">Upload Files</a></li> -->
		<li><a href="$CurrentProject.Link('snapshotslog')">Log</a></li>
	</ul>
</div>

<% with DataTransferForm %>
<form $FormAttributes class='form-inline'>
	<% loop VisibleFields %>$FieldHolder<% end_loop %>
	$Actions
	$HiddenFields
</form>
<% end_with %>