<div class="content page-header">
	<div class="row">
		<div class="col-md-12">
			<% include Breadcrumb %>
		</div>
	</div>
</div>

<div class="content">
	<div class="row">
		<div class="col-md-12 environment-details">
			<a href="$CurrentProject.Link"><i class="fa fa-long-arrow-left"></i> Back to overview</a>
		</div>
	</div>
<% if $CreateEnvironment %>
	<% with $CreateEnvironment %>
		<div class="deployment-status">
			<div class="progress deployment-progress">
				<div class="progress-bar
					<% if $ResqueStatus == 'Started' || $ResqueStatus == 'Running' %>
						progress-bar-striped active
					<% end_if %>
					$ResqueStatus" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" id="queue_action">

					Creating environment $Name
					<span class="jobstatus">$ResqueStatus.LowerCase</span>
				</div>
			</div>
		</div>

		<h5>Create log:</h5>
		<pre id="queue_log" class="log-content" data-loglink="$LogLink">$LogContent</pre>
	<% end_with %>
<% else_if $CurrentProject.canCreateEnvironments %>
	<div class="row">
		<div class="col-md-8">
			<% if $CreateEnvironmentsMessages %>
				<p class="alert alert-danger">$CreateEnvironmentsMessages</p>
			<% end_if %>

			<% if not $CreateEnvironmentsMessages %>
				$CreateEnvironmentForm
			<% end_if %>
		</div>
	</div>
<% end_if %>


</div>
