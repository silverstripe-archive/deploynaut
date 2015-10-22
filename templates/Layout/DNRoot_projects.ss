<div class="content page-header">
	<div class="row">
		<div class="col-md-7">
			<h1 class="page-heading">Stack overview</h1>
		</div>
	</div>
</div>
<div class="content">

	<% if $canCreateProjects %>
		<a href="{$Link}createproject" class="btn btn-primary pull-right">
			<i class="fa fa-plus"></i>
			Create Stack
		</a>
	<% end_if %>

	<%-- Dont show the search/filter if there are less than 5 projects in the list --%>
	<% if $DNProjectList.count > 5 %>
	<input type="search" class="table-filter form-control" data-table="table-projects" placeholder="Search for stack">
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
					<td class="project-name">
						<a href="$Link">$Name</a>
						<% if $IsStarred %>
							<a class="tooltip-hint" data-toggle="tooltip" data-original-title="Unstar this project" href="$ToggleStarLink"><i class="icon-star"></i></a>
						<% else %>
							<a class="tooltip-hint" data-toggle="tooltip" data-original-title="Star this project so it shows in the side navigation for quick access" href="$ToggleStarLink"><i class="icon-star hollow"></i></a>
						<% end_if %>


					</td>
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
					<td class="text-center">
						<a href="$Link">
							<% if $RunningEnvironmentCreations.count>0 %>
								<span class="tooltip-hint plat-icon fa fa-cog fa-spin" data-original-title="Environments are currently being built"></span>
							<% end_if %>
							$Environments.count
						</a>
					</td>
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
					<td colspan="5">No stacks are currently available to you.</td>
				</tr>
			<% end_if %>
			</tbody>
		</table>
	</div>
</div>

