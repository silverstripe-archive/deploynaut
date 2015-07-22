<div class="content page-header">
	<div class="row items-push">
		<div class="col-sm-7">
			<ol class="breadcrumb">
				<li><a href="#">$Project.Title</a></li>
				<li><a href="#">$Parent.Title FIX!!</a></li>
			</ol>
			<h1 class="page-heading">$Title</h1>
		</div>
	</div>


	<% if $CurrentProject %>

	<ul class="nav nav-tabs">
		<% if $Project.canBackup %>
		<li class="active"><a href="$CurrentProject.Link('createsnapshot')">Create Snapshot</a></li>
		<% end_if %>
		<% if $Project.canUploadArchive %>
		<li><a href="$CurrentProject.Link('uploadsnapshot')">Upload Snapshot</a></li>
		<% end_if %>
		<li><a href="$CurrentProject.Link('snapshotslog')">Log</a></li>
	</ul>
	<% end_if %>
</div>
<div class="content">

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
</div>
