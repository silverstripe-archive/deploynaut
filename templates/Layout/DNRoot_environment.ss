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
			<div class="col-md-12 clearfix">
				<%-- If there any potential issues or warnings with deployment, show them here. --%>
				<% if $DeploymentMessages %>
					$DeploymentMessages
				<% end_if %>

				<% if $CurrentBuild %>
					<% with $CurrentBuild %>
						<% include GitDetailedBuildReference BareURL=$Up.BareURL, URL=$Up.URL %>
					<% end_with %>
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

				<div class="table-responsive">
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
								<td class="text-center"><% if $Link %><a class="no-wrap" href="$Link">Details <i class="fa fa-angle-right"></i></a><% end_if %></td>
							</tr>
						<% end_loop %>
						</tbody>
					</table>
				</div>

			<% end_if %>
		<% end_if %>
	<% else %>
		<% if $CurrentEnvironment.CanDeploy %>
            <div id="deploy_form"></div>
            <script>
                var urls = {
                    project_url: "{$absoluteBaseURL}naut/api/$CurrentProject.Name",
                    env_url: "{$absoluteBaseURL}{$CurrentEnvironment.Link}"
                }
				var security_token = "{$SecurityID}";
            </script>
			<script src="/deploynaut/javascript/react-with-addons.min.js"></script>
            <script src="/deploynaut/javascript/deploy.js"></script>

		<% end_if %>
	<% end_if %>

	<div class="deploy-history">
		<h3>Deploy history</h3>

		<% if $DeployHistory %>
			<p>Below builds have previously been deployed to this environment.</p>
		<% end_if %>

		<div class="table-responsive">
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
				<% if $DeployHistory %>
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
				<% else %>
					<tr>
						<td colspan="5" class="text-center">No deployments have been made.</td>
					</tr>
				<% end_if %>
				</tbody>
			</table>
		</div>

		<div class="text-center">
			<% include Pagination Pagination=$DeployHistory %>
		</div>

	</div>
</div>
