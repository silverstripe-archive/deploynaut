<% if $CanViewArchives %>
	<% if $PendingDataArchives %>
		<div class="row">
			<div class="col-md-12">
				<h3>Snapshot Upload Requests</h3>

				<p>Lists any requests which are waiting for a file to be processed manually.</p>

				<table class="table table-bordered table-striped table-data-archives">
					<thead>
						<tr>
							<th>Date Created</th>
							<th>Requester</th>
							<th>Environment</th>
							<th>Upload Token</th>
							<th>Status</th>
						</tr>
					</thead>

					<tbody>
						<% loop $PendingDataArchives %>
							<tr>
								<td><span class="tooltip-hint" data-toggle="tooltip" data-original-title="$Created.Nice ($Created.Ago)">$Created.Date</span></td>
								<td>$Author.FirstName $Author.Surname</td>
								<td>$Environment.Name</td>
								<td>$UploadToken</td>
								<td><span class="label label-info">Pending</span></td>
							</tr>
						<% end_loop %>
					</tbody>
				</table>

				<% include Pagination Pagination=$PendingDataArchives %>
			</div>
		</div>
	<% end_if %>
<% end_if %>
