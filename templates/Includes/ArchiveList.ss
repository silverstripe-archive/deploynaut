<% if $CanUploadOrDownloadArchives %>
	<h3>Archive List</h3>
	<p>Here you can see a list of archive files that you have access to.</p>
	<% if $ArchiveList %>
		<table class="table table-bordered table-striped">
			<thead>
				<tr>
					<th>Date Created</th>
					<th>File Path</th>
					<th>File Size</th>
					<th>Upload Token</th>
					<th>Download</th>
					<th>Upload</th>
				</tr>
			</thead>

			<tbody>
				<% loop $ArchiveList %>
					<tr>
						<td>$Created.Nice</td>
						<td>$ArchiveFile.Filename.XML</td>
						<td>$FileSize</td>
						<td>$UploadToken.XML</td>
						<td><% if $CanDownload %><a href="$ArchiveFile.Link">Download link</a><% end_if %></td>
						<td><% if $CanUpload %>Upload link<% end_if %></td>
					</tr>
				<% end_loop %>
			</tbody>
		</table>
	<% else %>
		<p class="text-error">There are currently no archive files that you can access.</p>
	<% end_if %>
<% end_if %>