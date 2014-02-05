<h2>$Project.Title</h2>

<% if $CurrentProject %>
<ul class="nav nav-tabs">
	<li<% if ProjectOverview %> class="active"<% end_if %>><a href="naut/project/$CurrentProject.Name">Deploy</a></li>
	<li<% if SnapshotsSection %> class="active"<% end_if %>><a href="naut/project/$CurrentProject.Name/snapshots">Snapshots</a></li>
</ul>
<ul class="nav level-2">
	<% if $Project.canBackup %>
	<li><a href="$CurrentProject.Link('createsnapshot')">Create Snapshot</a></li>
	<% end_if %>
	<% if $Project.canUploadArchive %>
	<li class="active"><a href="$CurrentProject.Link('uploadsnapshot')">Upload Snapshot</a></li>
	<% end_if %>
	<li><a href="$CurrentProject.Link('snapshotslog')">Log</a></li>
</ul>
<% end_if %>

<% if DataArchive %>
    <h3>Successfully uploaded your snapshot</h3>
    <p>Your snapshot has been saved in Deploynaut.</p>
    <p>Please view the <a href="$BackURL">snapshots list</a> to restore this snapshot to an environment.</p>
<% else %>
	<h3>Upload Snapshot through your browser</h3>
	<p>Choose a local snapshot file to transfer to deploynaut (up to $UploadLimit). See below how to create this file. Once uploaded, you can choose to restore this file into an actual environment.</p>
	$UploadSnapshotForm

	<h3>Request Snapshot upload by post</h3>
	<p>For large files (more than $UploadLimit), you can also choose to send us a DVD, and have us upload the file for you. Submit a request below to start this process.</p>
	$PostSnapshotForm

	<% include SnapshotCreateInstructions %>
<% end_if %>
