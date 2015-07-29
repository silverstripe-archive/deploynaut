<div class="content page-header">
	<div class="row">
		<div class="col-md-7">
			<h1 class="page-heading">
				$CurrentProject.Title
			</h1>
		</div>
		<div class="col-md-5 repo-url">
			<% if $CurrentProject.RepositoryURL %>
				<label for="repoURL">Code Repository:</label>
				<input type="text" value="$CurrentProject.RepositoryURL" readonly>
			<% end_if %>
		</div>
	</div>
</div>

<div class="content">

	<% with $CurrentProject %>

		<h3 id="env">Environments</h3>
		<table class="table">
			<thead>
				<tr>
					<th>Name</th>
					<th>URL</th>
					<th>Build currently deployed</th>
					<th class="text-center">Deployment Status</th>
					<th class="text-center">Details</th>
				</tr>
			</thead>
			<tbody>
				<% if $DNEnvironmentList %>
				<% loop $DNEnvironmentList %>
				<tr>
					<td><% if CanDeploy %><a href="$Link">$Name</a><% else %>$Name<% end_if %></td>
					<td><% if $URL %><a href="$URL.URL">$URL.URL</a><% else %>&nbsp;<% end_if %></td>
					<td>
						<% if $CurrentBuild %>
						<span class="tooltip-hint" data-toggle="tooltip" title="$CurrentBuild.Message" data-original-title="$CurrentBuild.Message">
							$CurrentBuild.SHA
						</span>
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
				</tr>
				<% end_loop %>
				<% else %>
					<tr>
						<td colspan="5">No environments available yet!</td>
					</tr>
				<% end_if %>
			</tbody>
		</table>

		<div id="gitFetchModal" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
		  <div class="modal-header">
			<button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
			<h3 id="myModalLabel">Updating GIT repository</h3>
		  </div>
		  <div class="modal-body"></div>
		  <div class="modal-footer"></div>
		</div>

		<% if $PublicKey %>
			<h4>Deploy key</h4>
			<p>Permit us access to your private repositories by adding this deployment key.</p>
			<pre class="deploy-key">$PublicKey</pre>
		<% end_if %>

	<% end_with %>

</div>
