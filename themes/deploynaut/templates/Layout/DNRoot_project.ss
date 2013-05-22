<h3>Environments</h3>
<table class="table-striped table table-bordered">
	<thead>
		<tr>
			<th>Environment</th>
			<th>Build currently deployed</th>
			<th>Can you deploy?</th>
		</tr>
	</thead>
	<tbody>
	<% if DNEnvironmentList %>
	<% loop DNEnvironmentList %>
		<tr>
			<td><a href="$Link">$Name</a></td>
			<td>$CurrentBuild</td>
			<td>
			<% if CanDeploy %><span class="good">Yes</span><% else %><span class="bad">No, please <a href="http://helpdesk.cwp.govt.nz">request a deployment</a> on CWP helpdesk</span><% end_if %>
			</td>
		</tr>
	<% end_loop %>
	<% else %>
		<tr>
			<td colspan="3">No environments available yet!</td>
		</tr>
	<% end_if %>
	</tbody>
</table>

<a href="{$Link}/update" class="btn update-repository">Fetch latest changes</a>

<% loop DNBranchList %>
<% if DNBuildList.Count %>
<div class="project-branch$IsOpenByDefault">
<h3>
	<span class="open-icon">-</span><span class="closed-icon">+</span>
	$Name
	<small>last updated: $LastUpdated.Nice ($LastUpdated.Ago)</small>
</h3>
<div class="project-branch-content">
<p>Legend: 
	<span class="label label-info">release tag</span>
	<span class="label">other branch containing this</span>
</p>
<table class="table-striped table table-bordered">
	<thead>
		<tr>
			<th>Change ID</th>
			<th>Message</th>
			<th>Release</th>
			<th>Currently on</th>
			<th>Date created</th>
		</tr>
	</thead>
	<tbody>
	<% loop DNBuildList %>
		<tr>
			<td>$Name</td>
			<td title="$SubjectMessage $BodyMessage">$SubjectMessage</td>
			<td><% loop $References %>
				<span class="label <% if $Type = Tag %>label-info<% end_if %>" title="$Type">$Name</span>
			<% end_loop %>
			</td>
			<td>
				<% loop CurrentlyDeployedTo %>
				<a href="{$Link}">$Name</a><% if not $Last %>,<% end_if %>
				<% end_loop %>
			</td>
			<td>$Created.Nice ($Created.Ago)</td>
		</tr>
	<% end_loop %>
	</tbody>
</table>
</div>
</div>
<% end_if %>
<% end_loop %>
