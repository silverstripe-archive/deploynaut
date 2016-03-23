<% if $CanViewArchives %>
	<% if $PendingDataArchives %>
		<div class="row">
			<div class="col-md-12">
				<h3>Snapshot upload requests</h3>

				<p>Lists any requests which are waiting for a file to be processed manually.</p>

				<div class="table-responsive">
					<table class="table table-data-archives">
						<thead>
							<tr>
								<th>Date Created</th>
								<th>Requester</th>
								<th>Environment</th>
								<th>Upload Token</th>
								<th class="text-center">Status</th>
							</tr>
						</thead>

						<tbody>
							<% loop $PendingDataArchives %>
								<tr>
									<td><span class="tooltip-hint" data-toggle="tooltip" data-original-title="$Created.Nice ($Created.Ago)">$Created.Date</span></td>
									<td>$Author.FirstName $Author.Surname</td>
									<td>$Environment.Name</td>
									<td>$UploadToken</td>
									<td class="text-center"><span class="label label-info">Pending</span></td>
								</tr>
							<% end_loop %>
						</tbody>
					</table>
				</div>

				<% include Pagination Pagination=$PendingDataArchives %>
			</div>
		</div>
	<% end_if %>
<% end_if %>
