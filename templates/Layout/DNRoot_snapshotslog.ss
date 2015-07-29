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
		<li><a href="$CurrentProject.Link('uploadsnapshot')">Upload Snapshot</a></li>
		<% end_if %>
		<li class="active"><a href="$CurrentProject.Link('snapshotslog')">Log</a></li>
	</ul>
	<% end_if %>
</div>

<div class="content">
	<h3>$Title</h3>

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
					<% loop $DataTransferLogs %>
						<tr>
							<td><span class="tooltip-hint" data-toggle="tooltip" data-original-title="$Created.Nice ($Created.Ago)">$Created.Date</span></td>
							<td>$Author.FirstName $Author.Surname</td>
							<td>$Description</td>
							<td>$Environment.Name</td>
							<td>
							<% if $Status = 'Queued' %><span class="label label-info">Queued</span><% end_if %>
							<% if $Status = 'Started' %><span class="label label-info">Started</span><% end_if %>
							<% if $Status = 'Finished' %><span class="label label-success">Finished</span><% end_if %>
							<% if $Status = 'Failed' %><span class="label label-important">Failed</span><% end_if %>
							<% if $Status = 'n/a' %><span class="label label-inverse">n/a</span><% end_if %>
							</td>
							<td><% if $Origin != 'ManualUpload' %><a href="$LogLink">Details</a><% else %>-<% end_if %></td>
						</tr>
					<% end_loop %>
				</tbody>
			</table>

			<% if $DataTransferLogs.MoreThanOnePage %>
			<div class="pagination">
				<ul>
			    <% if $DataTransferLogs.NotFirstPage %>
			        <li><a class="prev" href="$DataTransferLogs.PrevLink">Prev</a></li>
			    <% end_if %>
			    <% loop $DataTransferLogs.Pages %>
			        <% if $CurrentBool %>
			            <li class="disabled"><a href="#">$PageNum</a></li>
			        <% else %>
			            <% if $Link %>
			                <li><a href="$Link">$PageNum</a></li>
			            <% else %>
			                <li class="disabled"><a href="#">...</a></li>
			            <% end_if %>
			        <% end_if %>
			        <% end_loop %>
			    <% if $DataTransferLogs.NotLastPage %>
			        <li><a class="next" href="$DataTransferLogs.NextLink">Next</a></li>
			    <% end_if %>
			    </ul>
			</div>
			<% end_if %>

			<% if $DataTransferLogs.MoreThanOnePage %>
			<div class="pagination">
				<ul>
			    <% if $DataTransferLogs.NotFirstPage %>
			        <li><a class="prev" href="$DataTransferLogs.PrevLink">Prev</a></li>
			    <% end_if %>
			    <% loop $DataTransferLogs.Pages %>
			        <% if $CurrentBool %>
			            <li class="disabled"><a href="#">$PageNum</a></li>
			        <% else %>
			            <% if $Link %>
			                <li><a href="$Link">$PageNum</a></li>
			            <% else %>
			                <li class="disabled"><a href="#">...</a></li>
			            <% end_if %>
			        <% end_if %>
			        <% end_loop %>
			    <% if $DataTransferLogs.NotLastPage %>
			        <li><a class="next" href="$DataTransferLogs.NextLink">Next</a></li>
			    <% end_if %>
			    </ul>
			</div>
			<% end_if %>

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
</div>
