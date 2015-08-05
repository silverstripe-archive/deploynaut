<div class="content page-header">
  	<div class="row">
		<div class="col-md-12">
			<% include Breadcrumb %>
			<% include DeploymentTabs %>
			<% include ProjectLinks %>
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

				<% if $CurrentBuild %>
					<% with $CurrentBuild %>
						<% include GitDetailedBuildReference BareURL=$Up.BareURL, URL=$Up.URL %>
					<% end_with %>
				<% else %>
					<p>
						No deployments have been made
					</p>
				<% end_if %>
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
							<th class="text-center">Status</th>
							<th class="text-center">More info</th>
						</tr>
					</thead>
					<tbody>
					<% loop DependentFilteredCommits %>
						<tr>
							<td><span class="tooltip-hint" data-toggle="tooltip" data-original-title="$LastEdited.Nice ($LastEdited.Ago)">$LastEdited.Date</span></td>
							<td><span class="tooltip-hint" data-toggle="tooltip" title="$Message" data-original-title="$Message">$SHA</span></td>
							<td>$Deployer.Name <% if $Deployer.Email %>&lt;$Deployer.Email&gt; <% end_if %></td>
							<td class="text-center">
							<% if $Status = 'Queued' %><span class="label label-info">Queued</span><% end_if %>
							<% if $Status = 'Started' %><span class="label label-info">Started</span><% end_if %>
							<% if $Status = 'Finished' %><span class="label label-success">Finished</span><% end_if %>
							<% if $Status = 'Failed' %><span class="label label-important">Failed</span><% end_if %>
							<% if $Status = 'n/a' %><span class="label label-inverse">n/a</span><% end_if %>
							</td>
							<td class="text-center"><% if $Link %><a href="$Link">Details <i class="fa fa-angle-right"></i></a><% end_if %></td>
						</tr>
					<% end_loop %>
					</tbody>
				</table>
			<% end_if %>
		<% end_if %>
	<% else %>
		<% if $CurrentEnvironment.CanDeploy && $DeployForm %>
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
				<span class="environment-name"><i class="fa fa-rocket">&nbsp;</i> Deployment options for $CurrentEnvironment.Name</span>

			</div>

			<div class="deploy-form-outer collapse clearfix" id="envDeploy">
				<%-- Deploy form will be put here with ajax --%>
			</div>
		<% end_if %>
	<% end_if %>

	<div class="deploy-history">
		<h3>Deploy history</h3>
		<p>Below builds have previously been deployed to this environment.</p>
		<table class="table table-striped table-hover">
			<thead>
				<tr>
					<th>Date deployed</th>
					<th>Build</th>
					<th>Deployer</th>
					<th class="text-center">Status</th>
					<th class="text-center">More info</th>
				</tr>
			</thead>
			<tbody>
			<% loop $DeployHistory %>
				<tr>
					<td><span>$LastEdited.Nice</span></td>
					<td>
						<% include GitBuildReference %>
					</td>
					<td>$Deployer.Name <% if $Deployer.Email %>&lt;$Deployer.Email&gt; <% end_if %></td>
					<td class="text-center">
					<% if $Status = 'Queued' %><span class="label label-info">Queued</span><% end_if %>
					<% if $Status = 'Started' %><span class="label label-info">Started</span><% end_if %>
					<% if $Status = 'Finished' %><span class="label label-success">Finished</span><% end_if %>
					<% if $Status = 'Failed' %><span class="label label-danger">Failed</span><% end_if %>
					<% if $Status = 'n/a' %><span class="label label-warning">n/a</span><% end_if %>
					</td>
					<td class="text-center"><% if $Link %><a href="$Link">Details <i class="fa fa-angle-right"></i></a><% end_if %></td>
				</tr>
			<% end_loop %>
			</tbody>
		</table>

        <div class="text-center">
			<% include Pagination Pagination=$DeployHistory %>
		</div>
	</div>
</div>
