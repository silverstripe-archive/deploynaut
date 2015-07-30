<div class="content page-header">
    <div class="row">
        <div class="col-md-9">
            <ol class="breadcrumb">
                <li><a href="naut/project/$CurrentEnvironment.Name">$CurrentEnvironment.Title</a></li>
            </ol>
            <h1 class="page-heading">Deployments</h1>

			<% include DeploymentTabs %>
        </div>

        <div class="col-md-3">
            <ul class="project-links">
				<% if $CurrentEnvironment.URL %>
                    <li>
                        <span class="fa fa-link"></span>
                        <a href="$CurrentEnvironment.URL.URL">$CurrentEnvironment.URL.URL</a>
                    </li>
				<% end_if %>
				<% if $CurrentProject.RepoURL %>
                    <li>
                        <span class="fa fa-code"></span>
                        <a href="$CurrentProject.RepoURL.URL">View Code</a>
                    </li>
				<% end_if %>
            </ul>
        </div>
    </div>
</div>



<div class="content">
	<div class="row">
		<div class="col-md-12 environment-details">
			<h4>Environment Details:</h4>

			<%-- Display current build on environment --%>
			<span>Target Revision: <em>$Deployment.SHA</em></span>

			<%-- Display Environment URL --%>
			<% if $CurrentEnvironment.URL %>
				<span>URL: <a href="$CurrentEnvironment.URL.URL">$CurrentEnvironment.URL.URL</a></span>
			<% end_if %>

		</div>
	</div>

<% if $Deployment %>
	<% with $Deployment %>
		<div class="deployment-status">
			<h5>Status:</h5>
			<div class="progress deployment-progress">
				<div class="progress-bar
					<% if $ResqueStatus == 'Started' || $ResqueStatus == 'Running' %>
						progress-bar-striped active
					<% end_if %>
					$ResqueStatus" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" id="queue_action">

					Deployment to $Environment.Name
					<span class="status">$ResqueStatus</span>
				</div>
			</div>
		</div>


		<h5>Deploy log:</h5>
		<pre id="queue_log" class="log-content" data-loglink="$LogLink">$LogContent</pre>
	<% end_with %>
<% end_if %>

</div>