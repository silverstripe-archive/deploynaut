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
	<div class="row">
		<div class="col-md-8 col-md-offset-2">
			
			<% if DataArchive %>
			    <h3>Successfully uploaded your snapshot</h3>
			    <p>Your snapshot has been saved.</p>
			    <p>Please view the <a href="$BackURL">snapshots list</a> to restore this snapshot to an environment.</p>
			<% else %>
				<div class="tab-content">
					<div class="tab-pane active" id="tab1">
						<a href="#tab2" class="pull-right upload-exceed-link" data-toggle="tab">File exceeds <% if $UploadLimit %>$UploadLimit<% else %>2GB<% end_if %>?</a>
						<h3>Upload a snapshot</h3>
						<p>Choose a local snapshot file to transfer<% if $UploadLimit %> (up to $UploadLimit)<% end_if %> (see below how to create this file). Once uploaded, you can choose to restore this file into an actual environment.</p>
						$UploadSnapshotForm
					</div>
					<div class="tab-pane " id="tab2">
						<a href="#tab1" class="pull-right upload-exceed-link" data-toggle="tab">File exceeds <% if $UploadLimit %>$UploadLimit<% else %>2GB<% end_if %>?</a>
						<h3>Upload a snapshot</h3>
						<div class="panel panel-default upload-exceed-container">
							<div class="panel-body">
								<a href="#tab1" class="pull-right upload-close" data-toggle="tab"><i class="fa fa-times"></i></a>
								<h4 class="font-w600">Large files</h4>
								<p>For large files <% if $UploadLimit %>exceeding $UploadLimit,<% end_if %> you can provide the file to us - we will then upload it on your behalf. Submit a request below to start this process.</p>
								$PostSnapshotForm
							</div>
						</div>
					</div>
				</div>
				<% include SnapshotCreateInstructions %>
			<% end_if %>
		</div>
	</div>
</div>
