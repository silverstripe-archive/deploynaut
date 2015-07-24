<div class="content page-header">
	<% include PageHeader %>

	<% if $CurrentProject %>
	<ul class="nav nav-tabs">
		<li>
			<a href="<% with $Navigation %><% loop $Project.Menu %>
					<% if $IsActive %>$Link<% end_if %><% end_loop %><% end_with %>">Overview</a>
		</li>

		<% if $CurrentProject.canBackup %>
		<li><a href="$CurrentProject.Link('createsnapshot')">Create Snapshot</a></li>
		<% end_if %>
		<% if $CurrentProject.canUploadArchive %>
		<li class="active"><a href="$CurrentProject.Link('uploadsnapshot')">Upload Snapshot</a></li>
		<% end_if %>
		<li><a href="$CurrentProject.Link('snapshotslog')">Log</a></li>
	</ul>
	<% end_if %>
</div>
<div class="content">

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
</div>
