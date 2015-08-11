<div class="content page-header">
	<div class="row items-push">
		<div class="col-sm-7">
			<h1 class="page-heading">Projects</h1>
		</div>
	</div>
</div>
<div class="content">
	<div class="table-responsive">
		<table class="table table-large">
			<thead>
				<tr>
					<th>Project name</th>
					<th>Live URL</th>
					<th>UAT URL</th>
					<th class="text-center">Environments</th>
					<th>Code</th>
				</tr>
			</thead>
			<tbody>
			<% if DNProjectList %>
			<% loop DNProjectList %>
				<tr>
					<td><a href="$Link">$Name</a></td>
					<td><a href="#">Live Link</a></td>
					<td><a href="#">UAT Link</a></td>
					<td class="text-center">3</td>
					<td><a href="#">Link</a></td>
				</tr>
			<% end_loop %>
			<% else %>
				<tr>
					<td>No projects available yet!</td>
				</tr>
			<% end_if %>
			</tbody>
		</table>
	</div>
</div>
