<% if $CanViewArchives %>
	<% if $DataArchives %>
		<table class="table table-bordered table-striped table-data-archives">
			<thead>
				<tr>
					<th>Date Created</th>
					<th>Author</th>
					<th>Environment</th>
					<th>Mode</th>
					<th>File Size</th>
					<th colspan="2">Actions</th>
				</tr>
			</thead>

			<tbody>
				<% loop $DataArchives.Sort("Created", "DESC") %>
					<tr>
						<td><span class="tooltip-hint" data-toggle="tooltip" data-original-title="$Created.Nice">$Created.Date</span></td>
						<td>$Author.FirstName $Author.Surname</td>
						<td>$Environment.Name</td>
						<td>$ModeNice</td>
						<td>$FileSize</td>
						<td class="action">
							<% if $CanDownload && ArchiveFile %>
							<a href="$ArchiveFile.Link">
								Download
							</a>
							<% end_if %>
						</td>
						<td class="action">
							<% if ArchiveFile %>
							<a href="$Top.CurrentProject.Link/restoresnapshot/$ID" class="extended-trigger" data-extended-target="#archive-list-extended-$ID" data-extended-container="#archive-list-extended-container-$ID">
								Restore
							</a>
							<% end_if %>
						</td>
					</tr>
					<tr class="extended" id="archive-list-extended-container-$ID">
						<td colspan="7">
							<p class="text-warning"><strong>Warning:</strong> This restore will overwrite the data on the chosen environment below</p>
							<div id="archive-list-extended-$ID"></div>
						</td>
					</tr>
				<% end_loop %>
			</tbody>
		</table>
	<% else %>
		<div class="alert">
			There are currently no archived files
		</div>
	<% end_if %>
<% else %>
	<div class="alert">
		There are currently no archived files that you can access
	</div>
<% end_if %>