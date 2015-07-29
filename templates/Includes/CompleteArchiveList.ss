<h3>Data Snapshots</h3>

<p>This is an archived list of all assets, databases or zip files containing both that you have access to view. Each item has links so you can download the files to your computer or restore the files to a chosen environment. If you would like to create a new snapshot from an environment, click 'Create Snapshot', the Log displays a list of all snapshot transfers.
If you would like to upload files from your computer to a new snapshot, click 'Upload Snapshot'
</p>

<% if $CanViewArchives %>
	<% if $CompleteDataArchives %>
		<table class="table table-bordered table-striped table-data-archives">
			<thead>
				<tr>
					<th>Date Created</th>
					<th>Author</th>
					<th>Source</th>
					<th>Owner</th>
					<th>Mode</th>
					<th>File Size</th>
					<th colspan="4">Actions</th>
				</tr>
			</thead>

			<tbody>
				<% loop $CompleteDataArchives %>
					<tr>
						<td><span class="tooltip-hint" data-toggle="tooltip" data-original-title="$Created.Nice ($Created.Ago)">$Created.Date</span></td>
						<td>$Author.FirstName $Author.Surname</td>
						<td><% if $IsManualUpload %>(upload)<% else %><% if OriginalEnvironment %>$OriginalEnvironment.Name<% else %><% end_if %><% end_if %></td>
						<td>$Environment.Name</td>
						<td>$ModeNice<% if $IsBackup %> (automated backup)<% end_if %></td>
						<td>$FileSize</td>
						<td class="action">
							<% if $CanDownload && $ArchiveFile && $validTargetEnvironments.count %>
								<a href="$Top.CurrentProject.Link/movesnapshot/$ID" class="extended-trigger" data-extended-target="#archive-list-extended-$ID" data-extended-container="#archive-list-extended-container-$ID">
									Move
								</a>
							<% end_if %>
						</td>
						<td class="action">
							<% if $CanDelete && ArchiveFile %>
								<a href="$Top.CurrentProject.Link/deletesnapshot/$ID" class="extended-trigger" data-extended-target="#archive-list-extended-$ID" data-extended-container="#archive-list-extended-container-$ID">
									Delete
								</a>
							<% end_if %>
						</td>
						<td class="action">
							<% if $CanDownload && ArchiveFile %>
								<a href="$ArchiveFile.Link" download="">
									Download
								</a>
							<% end_if %>
						</td>
						<td class="action">
							<% if $CanDownload && ArchiveFile %>
								<a href="$Top.CurrentProject.Link/restoresnapshot/$ID" class="extended-trigger" data-extended-target="#archive-list-extended-$ID" data-extended-container="#archive-list-extended-container-$ID">
									Restore
								</a>
							<% end_if %>
						</td>
					</tr>
					<tr class="extended archive-list-extended" id="archive-list-extended-container-$ID">
						<td colspan="10">
							<div id="archive-list-extended-$ID"></div>
						</td>
					</tr>
				<% end_loop %>
			</tbody>
		</table>

		<% if $CompleteDataArchives.MoreThanOnePage %>
		<div class="pagination">
			<ul>
		    <% if $CompleteDataArchives.NotFirstPage %>
		        <li><a class="prev" href="$CompleteDataArchives.PrevLink">Prev</a></li>
		    <% end_if %>
		    <% loop $CompleteDataArchives.Pages %>
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
		    <% if $CompleteDataArchives.NotLastPage %>
		        <li><a class="next" href="$CompleteDataArchives.NextLink">Next</a></li>
		    <% end_if %>
		    </ul>
		</div>
		<% end_if %>
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
