<div class="content page-header">

	<div class="row">
		<div class="col-sm-7">
			<ol class="breadcrumb">
				<li><a href="#">$CurrentProject.Title</a></li>
			</ol>
			<h1 class="page-heading">
			<% loop $Navigation %>
				<% loop $Project.Menu %>
					<% if $IsActive %>$Title<% end_if %>
				<% end_loop %>
			<% end_loop %>
			</h1>
		</div>
	</div>

</div>
<div class="content">

	<%-- <% if $CurrentProject %>
	<ul class="nav nav-tabs">
		<% loop $CurrentProject.Menu %>
		<li<% if $IsActive %> class="active"<% end_if %>><a href="$Link">$Title</a></li>
		<% end_loop %>
	</ul>
	<% end_if %> --%>

	<% with $CurrentProject %>
	<%-- <ul class="nav level-2">
	<% if DNEnvironmentList %>
		<% loop DNEnvironmentList %>
		<li><% if CanDeploy %><a href="$Link">$Name</a><% else %>$Name<% end_if %></li>
		<% end_loop %>
	<% else %>
		<li><a href="#env">Environments</a></li>
		<li><a href="#repo">Repository</a></li>
	<% end_if %>
	</ul> --%>

	<h3 id="env">Environments</h3>
	<table class="table">
		<thead>
			<tr>
				<th>Environment</th>
				<th>URL</th>
				<th>Build currently deployed</th>
				<th class="text-center">Can you deploy?</th>
				<th>More info</th>
			</tr>
		</thead>
		<tbody>
			<% if DNEnvironmentList %>
			<% loop DNEnvironmentList %>
			<tr>
				<td><% if CanDeploy %><a href="$Link">$Name</a><% else %>$Name<% end_if %></td>
				<td><% if $URL %><a href="$URL.URL">$URL.URL</a><% else %>&nbsp;<% end_if %></td>
				<td>
					<% if $CurrentBuild %>
					<span class="tooltip-hint" data-toggle="tooltip" title="$CurrentBuild.Message" data-original-title="$CurrentBuild.Message">
						$CurrentBuild.SHA
					</span>
					<% end_if %>
				</td>
				<td class="text-center">
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
	<div class="project-branch$IsOpenByDefault" data-href="$Link">
		<h3>
			<span class="open-icon">-</span><span class="closed-icon">+</span>
			$Name
			<small>last updated: $LastUpdated.Nice ($LastUpdated.Ago)</small>
		</h3>
		<div class="project-branch-content">
		<% if IsOpenByDefault %>
		<% include BranchInfo %>
		<% end_if %>
		</div>
	</div>
	<% end_loop %>
		<!-- </tbody>
	</table>
	</div>
	</div> -->
	<% end_with %>
</div>
