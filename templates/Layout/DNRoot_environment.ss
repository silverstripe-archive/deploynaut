<h2>
	<a href="naut/project/$Project.Name">$Project.Name</a>:$Name
	<% if URL %><small><a href="$URL">$URL</a></small><% end_if %>
</h2>

<% if $CurrentProject %>
	<ul class="nav nav-tabs">
		<li class="active"><a href="naut/project/$CurrentProject.Name">Deploy</a></li>
		<% if $FlagSnapshotsEnabled %>
			<li><a href="naut/project/$CurrentProject.Name/snapshots">Snapshots</a></li>
		<% end_if %>
	</ul>
<% end_if %>
<ul class="nav level-2">
<% if DNEnvironmentList %>
	<% loop DNEnvironmentList %>
	<li<% if $Top.Name = $Name %> class="active"<% end_if %>><% if CanDeploy %><a href="$Link">$Name</a><% else %>$Name<% end_if %></li>
	<% end_loop %>
<% end_if %>
</ul>

<% if $CurrentBuild %>
	<p>
		This environment is currently running build
		<span class="tooltip-hint" data-toggle="tooltip" title="$CurrentBuild.Message" data-original-title="$CurrentBuild.Message">
			$CurrentBuild.SHA
		</span>
	</p>
<% else %>
	<p>New environment - deploy your first build.</p>
<% end_if %>
<% if HasMetrics %>
	<p><a href="naut/project/$Project.Name/environment/$Name/metrics">See graphs for this environment</a></p>
<% end_if %>

<% if $HasPipelineSupport %>
	<% if $CurrentPipeline %>
		<% with $CurrentPipeline %>
			<h3 class="pull-left">Current Deployment</h3>

			<div class="btn-toolbar pull-right" id="deployprogress-actions">
				<% if $canAbort %>
				<div class="btn-group">
					<a href="$Link('abort')" id="deployprogress-abort" class="btn btn-warning btn-small"
					 onclick="return confirm('Are you sure you wish to abort this pipeline?');">
						Abort Pipeline
					</a>
				</div>
				<% end_if %>

				<div class="btn-group">
					<a class="btn" href="$Link">View Logs</a>
					<button class="btn dropdown-toggle" data-toggle="dropdown">
						<span class="caret"></span>
					</button>
					<ul class="dropdown-menu">
						<% loop $LogOptions %>
						<li><a href="$Link">$ButtonText</a></li>
						<% end_loop %>
					</ul>
				</div>
			</div>

			<%-- Deployment progress bar --%>
			<%-- This doesn't currently allow for FrontendSteps after the NonFrontendSteps --%>
			<% uncached %>
			<div class="row" id="deployprogress">
				<% loop $Steps %>
				<div class="span3 deployprogress-step <% if $isRunning %>deployprogress-step-active<% end_if %>">
					<p>$NiceName</p>
					<% if $isRunning %>
						<% if $Up.RunningOptions %><% loop $Up.RunningOptions %>
						<a class="btn btn-small $ButtonType btn-tooltip" data-toggle="tooltip" title="$Title" href="$Link">$ButtonText</a>
						<% end_loop %><% else %>
						<div class="progress progress-striped active">
							<div class="bar" style="width:100%"></div>
						</div>
						<% end_if %>
					<% else_if $isFinished %>
						<% if $Responder %>
						<p>by <em>$Responder.Name</em></p>
						<% end_if %>
					<% end_if %>
				</div>
				<% end_loop %>
			</div>
			<% end_uncached %>
		<% end_with %>
	<% else %>
		<h3>Initiate the release process</h3>
		<p class="alert alert-info">$GenericPipelineConfig.PipelineConfig.Description</p>
		$DeployForm
		<% if DependentFilteredCommits %>
			<% with $GenericPipelineConfig.PipelineConfig %>
				<h3>Successful $DependsOnProject:$DependsOnEnvironment releases</h3>
				<p>The following $DependsOnProject:$DependsOnEnvironment releases can be deployed</p>
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
	<% if DeployForm %>
		<h3>Deploy a new release</h3>
		<p>Choose a release below and press the 'Deploy to $Name' button.</p>
		$DeployForm
	<% end_if %>
<% end_if %>



<h3>Deploy history</h3>
<p>Below builds have previous been deployed to this environment, ordered by deploy date descending.</p>
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
	<% loop DeployHistory %>
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
