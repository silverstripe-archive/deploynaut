<div class="content page-header">
	<% include PageHeader %>

        <% if $CurrentProject %>
        <ul class="nav nav-tabs">
                <li>
                        <a href="<% with $Navigation %><% loop $Project.Menu %>
                                        <% if $IsActive %>$Link<% end_if %><% end_loop %><% end_with %>">Overview</a>
                </li>

                <% if $CurrentProject.canBackup %>
                <li class="active"><a href="$CurrentProject.Link('createsnapshot')">Create Snapshot</a></li>
                <% end_if %>
                <% if $CurrentProject.canUploadArchive %>
                <li><a href="$CurrentProject.Link('uploadsnapshot')">Upload Snapshot</a></li>
                <% end_if %>
                <li><a href="$CurrentProject.Link('snapshotslog')">Log</a></li>
        </ul>
        <% end_if %>
</div>
<div class="content text-center">
	<div class="row">
		<div class="col-md-8 col-md-offset-2">
			<h3 class="">Create a snapshot</h3>

			<p>Back up the database and/or assets into a file and transfer it to deploynaut. From there it can be downloaded or used for later restores</p>

			<% with $DataTransferForm %>
			<form $FormAttributes class='form-inline'>
				<% loop VisibleFields %>$FieldHolder<% end_loop %>
				$Actions
				$HiddenFields
			</form>
			<% end_with %>

			<div class="form-group">
<div class="col-sm-9">
<div class="form-material">
<input type="text" placeholder="Please enter your username" name="material-text" id="material-text" class="form-control" style="">
<label for="material-text">Username</label>
</div>
</div>
</div>
		</div>
	</div>
</div>
