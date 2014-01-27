<h3>Environments</h3>
<table class="table-striped table table-bordered">
	<thead>
		<tr>
			<th>Environment</th>
			<th>URL</th>
			<th>Build currently deployed</th>
			<th>Can you deploy?</th>
			<th>More info</th>
		</tr>
	</thead>
	<tbody>
	<% if DNEnvironmentList %>
	<% loop DNEnvironmentList %>
		<tr>
			<td><% if CanDeploy %><a href="$Link">$Name</a><% else %>$Name<% end_if %></td>
			<td><a href="$URL">$URL</a></td>
			<td>
				<% if $CurrentBuild %>
				<span class="tooltip-hint" data-toggle="tooltip" title="$CurrentBuild.Message" data-original-title="$CurrentBuild.Message">
					$CurrentBuild.SHA
				</span>
				<% end_if %>
			</td>
			<td>
			<% if CanDeploy %><span class="good">Yes</span>
			<% else_if DeployersList %>
			No, ask $DeployersList
			<% else %>
			<span class="bad">Deployment disabled</span>
			<% end_if %>
			</td>
			<td>
				<% if HasMetrics %>
				<a a href="$Link/metrics">Metrics</a>
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