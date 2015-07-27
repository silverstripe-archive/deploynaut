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
<ul class="nav nav-pills switch-tabs">
	<li class="active"><a href="#tab1" data-toggle="tab">Upload Data Snapshot</a></li>
	<li class="join"><p>or</p></li>
	<li><a href="#tab2" data-toggle="tab">Provide externally</a></li>
</ul>

<div class="tab-content">
	<div class="tab-pane active" id="tab1">
		<p>Choose a local snapshot file to transfer to deploynaut (up to $UploadLimit). See below how to create this file. Once uploaded, you can choose to restore this file into an actual environment.</p>
		$UploadSnapshotForm
	</div>
	<div class="tab-pane" id="tab2">
		<p>For large files (more than $UploadLimit), you can provide the file to us outside of Deploynaut - we will then upload it on your behalf. Submit a request below to start this process.</p>
		$PostSnapshotForm
	</div>
</div>
	<% include SnapshotCreateInstructions %>
<% end_if %>
