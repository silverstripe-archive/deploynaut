<h2>$Project.Title</h2>

<ul class="nav nav-pills pull-right">
	<li><a href="$CurrentProject.Link('createsnapshot')">Create</a></li>
	<li><a href="$CurrentProject.Link('uploadsnapshot')">Upload</a></li>
	<li class="active"><a href="#">Log</a></li>
</ul>

<h3>$Title</h3>
<p>This is an advanced view of all snapshot transfers</p>

<% if $CanUploadOrDownloadArchives %>	
	<% if $ArchiveList %>
		<table class="table table-bordered table-striped">
			<thead>
				<tr>
					<th>Date Created</th>
					<th>Author</th>
					<th>Target Environment</th>
					<th>File Size</th>
					<th colspan="3">Actions</th>
				</tr>
			</thead>

			<tbody>
				<% loop $ArchiveList %>
					<tr>
						<td><span class="tooltip-hint" data-toggle="tooltip" data-original-title="$Created.Nice">$Created.Date</span></td>
						<td>$Author.FirstName $Author.Surname</td>
						<td>$Environment.Name</td>
						<td>$FileSize</td>
						<td><a href="#">Details</a></td>
						<td><% if $CanDownload %><a href="#">Backup</a><% end_if %></td>
						<td><% if $CanUpload %><a href="#">Restore</a><% end_if %></td>
					</tr>
				<% end_loop %>
			</tbody>
		</table>
	<% else %>
		<p class="text-error">There are currently no archive files</p>
	<% end_if %>
<% else %>
	<p class="text-error">There are currently no archive files that you can access</p>
<% end_if %>