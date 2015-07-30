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

				<% if $PendingDataArchives.MoreThanOnePage %>
				<div class="pagination">
					<ul>
					<% if $PendingDataArchives.NotFirstPage %>
						<li><a class="prev" href="$PendingDataArchives.PrevLink">Prev</a></li>
					<% end_if %>
					<% loop $PendingDataArchives.Pages %>
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
					<% if $PendingDataArchives.NotLastPage %>
						<li><a class="next" href="$PendingDataArchives.NextLink">Next</a></li>
					<% end_if %>
					</ul>
				</div>
				<% end_if %>
			</div>
		</div>
	<% end_if %>
<% end_if %>