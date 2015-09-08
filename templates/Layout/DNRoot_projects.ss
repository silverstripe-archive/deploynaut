<div class="content page-header">
	<div class="row items-push">
		<div class="col-sm-7">
			<h1 class="page-heading">Projects</h1>
		</div>
	</div>
</div>
<div class="content">
	<%-- Dont show the search/filter if there are less than 5 projects in the list --%>
	<% if $DNProjectList.count > 5 %>
	<input type="search" class="table-filter form-control" data-table="table-projects" placeholder="Search for project">
	<% end_if %>

	<div class="table-responsive">
		<table class="table table-large table-striped table-hover table-projects">
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
