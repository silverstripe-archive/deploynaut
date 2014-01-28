<h2>$Project.Title</h2>

<h3>$Title</h3>
<p>This is an advanced view of all snapshot transfers</p>

<div class="button-nav">
	<ul class="nav nav-pills pull-right">
		<li><a href="$CurrentProject.Link('createsnapshot')">Create Snapshot</a></li>
		<li><a href="$CurrentProject.Link('uploadsnapshot')">Upload Files</a></li>
		<li class="active"><a href="$CurrentProject.Link('snapshotslog')">Log</a></li>
	</ul>
</div>

<% if $CanViewArchives %>
	<% if $DataTransferLogs %>
		<table class="table table-bordered table-striped">
			<thead>
				<tr>
					<th>Date Created</th>
					<th>Author</th>
					<th>Description</th>
					<th>Target Environment</th>
					<th>Status</th>
					<th colspan="3">Actions</th>
				</tr>
			</thead>

			<tbody>
				<% loop $DataTransferLogs.Sort("Created", "DESC") %>
					<tr>
						<td><span class="tooltip-hint" data-toggle="tooltip" data-original-title="$Created.Nice">$Created.Date</span></td>
						<td>$Author.FirstName $Author.Surname</td>
						<td>$Description</td>
						<td>$Environment.Name</td>
						<td>$Status</td>
						<td><a href="$LogLink">Details</a></td>
					</tr>
				<% end_loop %>
			</tbody>
		</table>
	<% else %>
		<div class="alert">
			There are currently no files that have been logged
		</div>
	<% end_if %>
<% else %>
	<div class="alert">
		There are currently no logged files that you can access
	</div>
<% end_if %>