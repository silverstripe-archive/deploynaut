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

	<% include EnvironmentActions_Before %>

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

	<% if $CurrentEnvironment.runningDeployments.count == 0 %>
		<% if $CurrentEnvironment.CanDeploy %>
			<div id="deployment-dialog-holder"></div>

			<script>
				var environmentConfigContext = {
					projectUrl: "{$absoluteBaseURL}naut/api/$CurrentProject.Name",
					envUrl: "{$absoluteBaseURL}{$CurrentEnvironment.Link}",
					gitRevisionsUrl: "{$absoluteBaseURL}{$CurrentEnvironment.Link}/git_revisions<% if $Redeploy %>?redeploy=1<% end_if %>",
					envName: "{$CurrentEnvironment.Name}",
					siteUrl: "{$CurrentEnvironment.URL}",
					<% if $PlatformSpecificStrings %>
						<% loop $PlatformSpecificStrings %>
							$Code: "$String",
						<% end_loop %>
					<% end_if %>
				};
			</script>
		<% else %>
			<% include CannotDeploy Environment=$CurrentEnvironment %>
		<% end_if %>
	<% else %>
		<div class="alert alert-warning">
			<i class="fa fa-cog fa-spin"></i>
			A deployment is <a href="$CurrentEnvironment.runningDeployments.first.Link" title="Click to view deployment progress.">in progress</a>.
		</div>
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
							<% if $FullDeployMessages %>
								<a class="full-deploy-info"
									data-toggle="popover"
									data-trigger="manual"
									data-placement="bottom"
									data-html="true"
									title="Full deployment"
									data-content="
										<% loop $FullDeployMessages %>
											<div><% if $Flag %>$Flag.ATT <% end_if %>$Text.ATT</div>
										<% end_loop %>
									"><i class="fa fa-flag"></i></a>
							<% end_if %>
							<% include GitBuildReference %>
						</td>
						<td>$Deployer.Name <% if $Deployer.Email %>&lt;$Deployer.Email&gt; <% end_if %></td>
						<td class="text-center">
							<% if $Status = 'Completed' %>
								<span class="label label-success">$Status</span>
							<% else_if $Status = 'Failed' %>
								<span class="label label-danger">$Status</span>
							<% else_if $Status = 'Aborting' %>
								<span class="label label-warning">$Status</span>
							<% else %>
								<span class="label label-info">$Status</span>
							<% end_if %>
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
