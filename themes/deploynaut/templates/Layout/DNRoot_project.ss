<h3>Environments</h3>
<table class="table-striped table table-bordered">
	<thead>
		<tr><th>Environment</th><th>Build currently deployed</th><th>Can you deploy?</th></tr>
	</thead>
	<tbody>
	<% control DNEnvironmentList %>
		<tr>
			<td><a href="$Link">$Name</a></td>
			<td>$CurrentBuild</td>
			<td>
			<% if CanDeploy %><span class="good">Yes</span>
			<% else_if DeployersList %>
			No, ask $DeployersList
			<% else %>
			Deployment disabled
			<% end_if %>
			</td>
		</tr>
	<% end_control %>
	</tbody>
</table>

<% loop DNBranchList %>
<% if DNBuildList.Count %>
<h3>$Name (last updated $LastUpdated.Nice)</h3>
<p>Legend: 
	<span class="label label-info">release tag</span>
	<span class="label">other branch containing this</span>
</p>
<table class="table-striped table table-bordered">
	<thead>
		<tr>
			<th>Build name</th>
			<th>Reference</th>
			<th>Currently on</th>
			<th>Date for build creation</th>
		</tr>
	</thead>
	<tbody>
	<% loop DNBuildList %>
		<tr>
			<td>$Name</td>
			<td><% loop $References %>
				<span class="label <% if $Type = Tag %>label-info<% end_if %>" title="$Type">$Name</span>
			<% end_loop %>
			</td>
			<td>
				<% control CurrentlyDeployedTo %>
				<a href="{$Link}">$Name</a><% if not $Last %>,<% end_if %>
				<% end_control %>
			</td>
			<td>$Created</td>
		</tr>
	<% end_loop %>
	</tbody>
</table>
<% end_if %>
<% end_loop %>