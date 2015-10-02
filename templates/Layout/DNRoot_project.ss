<div class="content page-header">
	<div class="row">
		<div class="col-md-12">
			<% include Breadcrumb %>
			<% include DeploymentTabs Overview=true %>
			<% include ProjectLinks %>
		</div>
	</div>
</div>

<div class="content">

	<% with $CurrentProject %>

		<% if $CreateEnvironmentLink %>
			<div class="row">
				<div class="col-md-12">
					<a href="$CreateEnvironmentLink" class="btn btn-primary pull-right">
						<i class="fa fa-plus"></i>
						Create Environment
					</a>
				</div>
			</div>
		<% end_if %>

		<div class="table-responsive">
			<table class="table table-striped table-hover">
				<thead>
					<tr>
						<th>Name</th>
						<th>URL</th>
						<th>Build currently deployed</th>
						<th class="text-center">Can you deploy?</th>
						<th class="text-center">Logs</th>
					</tr>
				</thead>
				<tbody>
					<% if $DNEnvironmentList %>
					<% loop $DNEnvironmentList %>
					<tr>
						<td><a href="$Link">$Name</a></td>
						<td><% if $URL %><a href="$URL">$BareURL</a><% else %>&nbsp;<% end_if %></td>
						<td>
							<% if $CurrentBuild %>
								<% with $CurrentBuild %><% include GitBuildReference %><% end_with %>
							<% else %>
								<em>Nothing has been deployed.</em>
							<% end_if %>
						</td>
						<td class="text-center">
							<% if $CanDeploy %>
								<span class="label label-success">Yes</span>
							<% else %>
								<span class="label label-danger">No</span>
							<% end_if %>
						</td>
						<td class="text-center">
							<% if $CreateEnvironment %>
								<a href="$CreateEnvironment.LogLink">Create log</a>
							<% end_if %>
							<% if $LogsLink %>
								<a href="$LogsLink">Server logs</a>
							<% else %>
								<em>-</em>
							<% end_if %>
						</td>
					</tr>
					<% end_loop %>
					<% else %>
						<tr>
							<td colspan="5">No environments available yet!</td>
						</tr>
					<% end_if %>
				</tbody>
			</table>
		</div>
	<% end_with %>

	<% if $CurrentProject.canCreateEnvironments %>
		<% if $CreateEnvironmentList %>
			<h4>Environment creation log</h4>
			<div class="table-responsive">
				<table class="table table-striped table-hover">
					<thead>
						<tr>
							<th>Date</th>
							<th>Name</th>
							<th>Creator</th>
							<th class="text-center">Status</th>
							<th class="text-center">More info</th>
						</tr>
					</thead>
					<tbody>
					<% loop $CreateEnvironmentList %>
						<tr>
							<td><span class="tooltip-hint" data-toggle="tooltip" data-original-title="$LastEdited.Nice ($LastEdited.Ago)">$LastEdited.Nice</span></td>
							<td>$Name</td>
							<td>$Creator.Name <% if $Creator.Email %>&lt;$Creator.Email&gt; <% end_if %></td>
							<td class="text-center">
							<% if $Status = 'Queued' %><span class="label label-info">Queued</span><% end_if %>
							<% if $Status = 'Started' %><span class="label label-info">Running</span><% end_if %>
							<% if $Status = 'Finished' %><span class="label label-success">Finished</span><% end_if %>
							<% if $Status = 'Failed' %><span class="label label-danger">Failed</span><% end_if %>
							<% if $Status = 'n/a' %><span class="label label-inverse">n/a</span><% end_if %>
							</td>
							<td class="text-center"><% if $Link %><a class="no-wrap" href="$Link">Details <i class="fa fa-angle-right"></i></a><% end_if %></td>
						</tr>
					<% end_loop %>
					</tbody>
				</table>
				<div class="text-center">
					<% include Pagination Pagination=$CreateEnvironmentList %>
				</div>
			</div>
		<% end_if %>
	<% end_if %>

	<% if $CurrentProject.PublicKey %>
		<h4>Deploy key</h4>
		<p>Permit us access to your private repositories by adding this deployment key.</p>
		<pre class="deploy-key">$CurrentProject.PublicKey</pre>
	<% end_if %>
</div>
