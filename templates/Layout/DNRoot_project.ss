<% with Project %>
<h2>$Title</h2>
<% end_with %>

<% if $CurrentProject %>
<ul class="nav nav-tabs">
	<li<% if ProjectOverview %> class="active"<% end_if %>><a href="naut/project/$CurrentProject.Name">Deploy</a></li>
	<li<% if SnapshotsSection %> class="active"<% end_if %>><a href="naut/project/$CurrentProject.Name/snapshots">Snapshots</a></li>
</ul>
<% end_if %>
<% with Project %>
<ul class="nav level-2">
<% if DNEnvironmentList %>
	<% loop DNEnvironmentList %>
	<li><% if CanDeploy %><a href="$Link">$Name</a><% else %>$Name<% end_if %></li>
	<% end_loop %>
<% else %>
	<li><a href="#env">Environments</a></li>
	<li><a href="#repo">Repository</a></li>
<% end_if %>
</ul>

<h3 id="env">Environments</h3>
<p>Choose an environment to start the deployment process</p>
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

	<h3 id="repo">Repository</h3>
	<p>Click the 'Fetch latest changes' button to update the Repository branches list below. Select the +/- button to hide/show the commits for each branch</p>

	<% if getRepositoryURL %>
		<pre>Repository URL: $getRepositoryURL</pre>
	<% end_if %>
	<% if repoExists %>
		<a href="#gitFetchModal" class="btn update-repository" data-api-url="$APILink(fetch)">Fetch latest changes</a>
	<% else %>
		<p>Getting latest changes from your repository. You may refresh this page at will.</p>
	<% end_if %>

	<div id="gitFetchModal" class="modal hide fade" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
	  <div class="modal-header">
	    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
	    <h3 id="myModalLabel">Updating GIT repository</h3>
	  </div>
	  <div class="modal-body"></div>
	  <div class="modal-footer"></div>
	</div>

	<% if getPublicKey %>
		<h3>Public key</h3>
		<pre>$getPublicKey</pre>
	<% end_if %>

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
				<th>Release</th>
				<th>Commit message</th>
				<th>Currently on</th>
				<th>Date created</th>
				<% if Top.ReleaseSteps %>
				<th>Release Process</th>
				<% end_if %>
			</tr>
		</thead>
		<tbody>
		<% loop DNBuildList %>
			<tr>
				<td>$FullName
					<% loop $References %>
					<span class="label <% if $Type = Tag %>label-info<% end_if %>" title="$Type">$Name</span>
					<% end_loop %>
				</td>
				<td title="$SubjectMessage $BodyMessage">$SubjectMessage</td>
				<td>
					<% loop CurrentlyDeployedTo %>
					<a href="{$Link}">$Title</a><% if not $Last %>,<% end_if %>
					<% end_loop %>
				</td>
				<td class="nowrap"><span class="tooltip-hint" data-toggle="tooltip" data-original-title="$Created.Nice ($Created.Ago)">$Created.Date</span></td>
				<% if ReleaseSteps %>
				<td class="release-process nowrap">
					<% loop ReleaseSteps %>
					<% if $Status = "success" %>
					<a href="$Link" class="label label-success $FirstLast">$Name</a>
					<% else_if $Status = "failure" %>
					<a href="$Link" class="label label-important $FirstLast">$Name</a>
					<% else %>
					<a href="$Link" class="label $FirstLast">$Name</a>
					<% end_if %>
					<% end_loop %>
				</td>
				<% end_if %>
			</tr>
		<% end_loop %>
		</tbody>
	</table>
	</div>
	</div>
	<% end_if %>
	<% end_loop %>
	</tbody>
</table>
</div>
</div>
<% end_with %>