<div class="content page-header">
	<div class="row">
		<div class="col-md-7">
			<h1 class="page-heading">Stack overview</h1>
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
					<th>Stack title</th>
					<th>Production URL</th>
					<th>UAT URL</th>
					<th class="text-center">Environments</th>
					<th>Code</th>
				</tr>
			</thead>
			<tbody>
			<% if $DNProjectList %>
			<% loop $DNProjectList %>
				<tr>
					<td><a href="$Link">$Name</a></td>
					<td>
						<% if $EnvironmentsByUsage("Production").First %>
							<% with $EnvironmentsByUsage("Production").First %><a href="$URL" target="_blank">$BareURL</a><% end_with %>
						<% else %>
							-
						<% end_if %>
					</td>
					<td>
						<% if $EnvironmentsByUsage("UAT").First %>
							<% with $EnvironmentsByUsage("UAT").First %><a href="$URL" target="_blank">$BareURL</a><% end_with %>
						<% else %>
							-
						<% end_if %>
					</td>
					<td class="text-center"><a href="$Link">$Environments.count</a></td>
					<td>
						<% if $RepositoryInterface %>
							<% with $RepositoryInterface %>
								<div class="repo-ux">
									<img src="$Icon" />
									<a href="$URL">View code<i class="fa fa-external-link-square superscript"></i></a>
								</div>
							<% end_with %>
						<% else %>
							-
						<% end_if %>
					</td>
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

