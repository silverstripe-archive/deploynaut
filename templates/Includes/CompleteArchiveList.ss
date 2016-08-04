<div class="row">
	<div class="col-md-12">
		<h3>Snapshots</h3>

		<% if $CanViewArchives %>
			<% if $CompleteDataArchives %>
				<div class="table-responsive">
					<table class="table table-bordered table-striped table-data-archives">
						<thead>
							<tr>
								<th>Date Created</th>
								<th>Author</th>
								<th>Source</th>
								<th>Environment</th>
								<th>Mode</th>
								<th>File Size</th>
								<th>Actions</th>
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
									<td class="text-center">
	                                    <div class="btn-group" role="group">
											<% if $CanDownload && $ArchiveFile && $validTargetEnvironments.count %>
	                                            <a href="$Top.CurrentProject.Link/movesnapshot/$ID" class="extended-trigger btn" data-extended-target="#archive-list-extended-$ID" data-extended-container="#archive-list-extended-container-$ID">
	                                                Move
	                                            </a>
											<% end_if %>
											<% if $CanDelete && $ArchiveFile %>
	                                            <a href="$Top.CurrentProject.Link/deletesnapshot/$ID" class="extended-trigger btn" data-extended-target="#archive-list-extended-$ID" data-extended-container="#archive-list-extended-container-$ID">
	                                                Delete
	                                            </a>
											<% end_if %>
											<% if $CanDownload && $ArchiveFile %>
	                                            <a href="$ArchiveFile.Link" download="" class="btn">
	                                                Download
	                                            </a>
											<% end_if %>
											<% if $CanDownload && $ArchiveFile %>
	                                            <a href="$Top.CurrentProject.Link/restoresnapshot/$ID" class="extended-trigger btn" data-extended-target="#archive-list-extended-$ID" data-extended-container="#archive-list-extended-container-$ID">
	                                                Restore
	                                            </a>
											<% end_if %>
	                                    </div>
									</td>
								</tr>
								<tr class="extended archive-list-extended" id="archive-list-extended-container-$ID">
									<td colspan="10">
										<div id="archive-list-extended-$ID" class="archive-extended hide"></div>
									</td>
								</tr>
							<% end_loop %>
						</tbody>
					</table>
				</div>

				<% include Pagination Pagination=$CompleteDataArchives %>
			<% else %>
				<div class="alert alert-info">
					There are currently no archived files
				</div>
			<% end_if %>
		<% else %>
			<div class="alert-warning">
				<i class="fa fa-exclamation-circle"></i>You currently have no access to snapshotting functionality on any of the environments.
			</div>
		<% end_if %>
	<% else %>
		<div class="alert alert-info">
			<i class="fa fa-info-circle"></i>There are currently no archived files
		</div>
	<% end_if %>
<% else %>
	<div class="alert-warning">
		<i class="fa fa-exclamation-circle"></i>You currently have no access to snapshotting functionality on any of the environments.
	</div>
</div>
