<div class="content page-header">
  	<div class="row">
		<div class="col-md-7">
			<% include Breadcrumb %>
			<% include DeploymentTabs %>
		</div>
		<div class="col-md-5">
			<ul class="project-links">
				<% if $CurrentProject.RepositoryInterface %><% with $CurrentProject.RepositoryInterface %>
					<li>
						<div class="repo-ux">
							<img src="$Icon" />
							<a href="$URL">View code on $Name</a>
						</div>
					</li>
				<% end_with %><% end_if %>
				<% if $CurrentProject.RepositoryURL %>
					<li>
						<div class="repo-url">
							<label for="repoURL">Code Repository:</label>
							<input type="text" value="$CurrentProject.RepositoryURL" readonly>
						</div>
					</li>
				<% end_if %>
			</ul>
		</div>
	</div>
</div>

<div class="content">

	<% with $CurrentEnvironment %>
		<div class="row environment-details">
			<div class="col-md-12">
				<%-- If there any potential issues or warnings with deployment, show them here. --%>
				<% if $DeploymentMessages %>
					$DeploymentMessages
				<% end_if %>

				<h4>Environment Details:</h4>

				<ul>
					<%-- Display Environment URL --%>
					<% if $URL %>
						<li>
							<span class="fa fa-link"></span>
							<a href="$URL">View site at $BareURL</a>
						</li>
					<% end_if %>

					<%-- Display logs link for environment --%>
					<% if $LogsLink %>
						<li>
							Logs: <a href="$LogsLink">View Logs for $Name</a>
						</li>
					<% end_if %>

					<%-- Display metrics for environment --%>
					<% if $Project.HasMetrics %>
						<li>
							Metrics:
							<a href="naut/project/$Project.Name/environment/$Name/metrics">
								See graphs for this environment
							</a>
						</li>
					<% end_if %>

					<%-- Display current build on environment --%>
					<li>
						Deployed Revision:
						<% if $CurrentBuild %>
							<a class="tooltip-hint"
							   data-toggle="tooltip"
							   title="$CurrentBuild.Message"
							   data-original-title="$CurrentBuild.Message"
							   href="$CurrentBuild.Link">

								$CurrentBuild.SHA
							</a>
						<% else %>
							No deployments have been made
						<% end_if %>
					</li>

					<% if $CurrentBuild %>
						<li>
							Latest deployed change: $CurrentBuild.Message
						</li>
					<% end_if %>

				</ul>
			</div>
		</div>
	<% end_with %>

	<% if $HasPipelineSupport %>
		<% if $CurrentPipeline %>
			<% with $CurrentPipeline %>
				<div class="Pipeline-Status">
					<% include PipelineStatus %>
				</div>
			<% end_with %>
		<% else %>
			<h3>Initiate the release process</h3>
			<p class="alert alert-info">$GenericPipelineConfig.PipelineConfig.Description</p>
			$DeployForm
			<% if $DependentFilteredCommits %>
				<% with $GenericPipelineConfig.PipelineConfig %>
					<h3>Successful $CurrentEnvironment.DependsOnProject:$CurrentEnvironment.DependsOnEnvironment releases</h3>
					<p>The following $CurrentEnvironment.DependsOnProject:$CurrentEnvironment.DependsOnEnvironment releases can be deployed</p>
				<% end_with %>
				<table class="table-striped table table-bordered">
					<thead>
						<tr>
							<th>Date deployed</th>
							<th>Build</th>
							<th>Deployer</th>
							<th>Status</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
					<% loop DependentFilteredCommits %>
						<tr>
							<td><span class="tooltip-hint" data-toggle="tooltip" data-original-title="$LastEdited.Nice ($LastEdited.Ago)">$LastEdited.Date</span></td>
							<td><span class="tooltip-hint" data-toggle="tooltip" title="$Message" data-original-title="$Message">$SHA</span></td>
							<td>$Deployer.Name <% if $Deployer.Email %>&lt;$Deployer.Email&gt; <% end_if %></td>
							<td>
							<% if $Status = 'Queued' %><span class="label label-info">Queued</span><% end_if %>
							<% if $Status = 'Started' %><span class="label label-info">Started</span><% end_if %>
							<% if $Status = 'Finished' %><span class="label label-success">Finished</span><% end_if %>
							<% if $Status = 'Failed' %><span class="label label-important">Failed</span><% end_if %>
							<% if $Status = 'n/a' %><span class="label label-inverse">n/a</span><% end_if %>
							</td>
							<td><% if $Link %><a href="$Link">Details</a><% end_if %></td>
						</tr>
					<% end_loop %>
					</tbody>
				</table>
			<% end_if %>
		<% end_if %>
	<% else %>
		<% if $DeployForm %>

			<% with $DeployForm %>
				<% if $Message %>
					<p id="{$FormName}_error" class="alert alert-$MessageType">$Message</p>
					$clearMessage
				<% end_if %>
			<% end_with %>

			<div class="deploy-dropdown" data-api-url="$CurrentProject.APILink('fetch')" aria-controls="#envDeploy"
				 data-form-url="$CurrentEnvironment.Link/DeployForm">

				<span class="status-icon" aria-hidden="true"></span>
				<span class="loading-text">Fetching latest code&hellip;</span>
				<span class="environment-name">Deploy to $CurrentEnvironment.Name</span>
				
			</div>

			<div class="deploy-form-outer collapse clearfix" id="envDeploy">
					<%-- Deploy form will be put here with ajax --%>
			</div>
		<% end_if %>
	<% end_if %>



	<div class="deploy-history">
		<h3>Deploy history</h3>
		<p>Below builds have previously been deployed to this environment.</p>
		<table class="table-striped table table-bordered">
			<thead>
				<tr>
					<th>Date deployed</th>
					<th>Build</th>
					<th>Deployer</th>
					<th>Status</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
			<% loop $CurrentEnvironment.DeployHistory.limit(20) %>
				<tr>
					<td><span class="tooltip-hint" data-toggle="tooltip" data-original-title="$LastEdited.Nice ($LastEdited.Ago)">$LastEdited.Date</span></td>
					<td><span class="tooltip-hint" data-toggle="tooltip" title="$Message" data-original-title="$Message">$SHA</span></td>
					<td>$Deployer.Name <% if $Deployer.Email %>&lt;$Deployer.Email&gt; <% end_if %></td>
					<td>
					<% if $Status = 'Queued' %><span class="label label-info">Queued</span><% end_if %>
					<% if $Status = 'Started' %><span class="label label-info">Started</span><% end_if %>
					<% if $Status = 'Finished' %><span class="label label-success">Finished</span><% end_if %>
					<% if $Status = 'Failed' %><span class="label label-danger">Failed</span><% end_if %>
					<% if $Status = 'n/a' %><span class="label label-warning">n/a</span><% end_if %>
					</td>
					<td><% if $Link %><a href="$Link">Details</a><% end_if %></td>
				</tr>
			<% end_loop %>
			</tbody>
		</table>
	</div>
</div>
