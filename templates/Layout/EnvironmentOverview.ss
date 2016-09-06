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
			</div>
		</div>
	<% end_with %>

	$getReactComponent(EnvironmentOverview)
</div>
