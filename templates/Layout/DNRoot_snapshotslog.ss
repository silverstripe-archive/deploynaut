<div class="content page-header">
	<div class="row">
		<div class="col-md-9">
			<% include Breadcrumb %>

			<% if $CurrentProject %>
			<ul class="nav nav-tabs">
				<li><a href="$CurrentProject.Link('snapshots')">Overview</a></li>

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
	</div>
</div>

<div class="content">
	<h3>$Title</h3>

	<% if $CanViewArchives %>
		<% if $DataTransferLogs %>

		<div class="table-responsive">
			<table class="table table-bordered table-striped">
				<thead>
					<tr>
						<th>Date Created</th>
						<th>Author</th>
						<th>Description</th>
						<th>Target Environment</th>
						<th class="text-center">Status</th>
						<th class="text-center">More info</th>
					</tr>
				</thead>

				<tbody>
					<% loop $DataTransferLogs %>
						<tr>
							<td><span class="tooltip-hint" data-toggle="tooltip" data-original-title="$Created.Nice ($Created.Ago)">$Created.Date</span></td>
							<td>$Author.FirstName $Author.Surname</td>
							<td>$Description</td>
							<td>$Environment.Name</td>
							<td class="text-center">
							<% if $Status = 'Queued' %><span class="label label-info">Queued</span><% end_if %>
							<% if $Status = 'Started' %><span class="label label-info">Started</span><% end_if %>
							<% if $Status = 'Finished' %><span class="label label-success">Finished</span><% end_if %>
							<% if $Status = 'Failed' %><span class="label label-danger">Failed</span><% end_if %>
							<% if $Status = 'n/a' %>
								<span class="label label-default">
									<% if $Origin == 'ManualUpload' %>
										Uploaded
									<% else %>
										n/a
									<% end_if %>
								</span>
							<% end_if %>
							</td>
							<td class="text-center"><% if $Origin != 'ManualUpload' %><a class="no-wrap" href="$Link">Details <i class="fa fa-angle-right"></i></a><% else %>-<% end_if %></td>
						</tr>
					<% end_loop %>
				</tbody>
			</table>
		</div>

        <div class="text-center">
			<% include Pagination Pagination=$DataTransferLogs %>
        </div>

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
