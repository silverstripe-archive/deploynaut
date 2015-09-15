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

		<h3 id="env">Environments</h3>

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

		<% if $PublicKey %>
			<h4>Deploy key</h4>
			<p>Permit us access to your private repositories by adding this deployment key.</p>
			<pre class="deploy-key">$PublicKey</pre>
		<% end_if %>

	<% end_with %>

	<% if $CurrentProject.canCreateEnvironments %>
		$CreateEnvironmentForm
	<% end_if %>

</div>
