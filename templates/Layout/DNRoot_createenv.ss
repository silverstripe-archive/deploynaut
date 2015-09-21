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
			<h5>Status:</h5>
			<div class="progress deployment-progress">
				<div class="progress-bar
					<% if $ResqueStatus == 'Started' || $ResqueStatus == 'Running' %>
						progress-bar-striped active
					<% end_if %>
					$ResqueStatus" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" id="queue_action">

					Creating environment
					<span class="status">$ResqueStatus</span>
				</div>
			</div>
		</div>

		<h5>Create log:</h5>
		<pre id="queue_log" class="log-content" data-loglink="$LogLink">$LogContent</pre>
	<% end_with %>
<% else_if $CurrentProject.canCreateEnvironments %>
	<h4>Create an environment</h4>
	<% if $CreateEnvironmentsMessages %>
		<p class="alert alert-danger">$CreateEnvironmentsMessages</p>
	<% end_if %>

	<% if not $CreateEnvironmentsMessages %>
		<% with CreateEnvironmentForm %>
			$addExtraClass('create-form')
		<% end_with %>
	<% end_if %>
<% end_if %>


</div>
