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
		<table class="table table-striped table-hover">
			<thead>
				<tr>
					<th>Name</th>
					<th>URL</th>
					<th>Build currently deployed</th>
					<th class="text-center">Can you deploy?</th>
					<th class="text-center">Logs</th>
					<th class="text-center">More info</th>
				</tr>
			</thead>
			<tbody>
				<% if $DNEnvironmentList %>
				<% loop $DNEnvironmentList %>
				<tr>
					<td><% if CanDeploy %><a href="$Link">$Name</a><% else %>$Name<% end_if %></td>
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
							<span class="label label-success">Enabled</span>
						<% else %>
							<span class="label label-danger">Disabled</span>
						<% end_if %>
					</td>
					<td class="text-center">
						<% if $HasMetrics %>
							<a href="$Link/metrics">Metrics</a>
						<% end_if %>
						<% if $LogsLink %>
							<a href="$LogsLink">Logs</a>
						<% end_if %>
						<% if not $HasMetrics && not $LogsLink %>
							<em>-</em>
						<% end_if %>
					</td>
					<td class="text-center">
						<a href="$Link"><span class="glyphicon glyphicon-menu-right"></span></a>
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


		<% if $PublicKey %>
			<h4>Deploy key</h4>
			<p>Permit us access to your private repositories by adding this deployment key.</p>
			<pre class="deploy-key">$PublicKey</pre>
		<% end_if %>

	<% end_with %>

</div>
