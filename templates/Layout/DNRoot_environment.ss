<h2>
	<a href="naut/project/$Project.Name">$Project.Name</a>:$Name
	<% if URL %><small><a href="$URL">$URL</a></small><% end_if %>
</h2>

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

<% if DeployForm %>
<h3>Deploy a new release</h3>
<p>Choose a release below and press the 'Deploy to $Name' button.</p>

<% with DeployForm %>
<form $FormAttributes class='form-inline'>
	<% loop VisibleFields %>$FieldHolder<% end_loop %>
	$Actions
	$HiddenFields
</form>
<% end_with %>
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
			<td>$LastEdited.Rfc2822</td>
			<td><span class="tooltip-hint" data-toggle="tooltip" title="$Message" data-original-title="$Message">$SHA</span></td>
			<td>$Deployer.Name <% if $Deployer.Email %>&lt;$Deployer.Email&gt; <% end_if %></td>
			<td>
			<% if $Status = 'Queued' %><span class="label label-info">Queued</span><% end_if %>
			<% if $Status = 'Started' %><span class="label label-info">Started</span><% end_if %>
			<% if $Status = 'Finished' %><span class="label label-success">Finished</span><% end_if %>
			<% if $Status = 'Failed' %><span class="label label-important">Failed</span><% end_if %>
			<% if $Status = 'n/a' %><span class="label label-inverse">n/a</span><% end_if %>
			</td>
			<td><% if $LogLink %><a href="$LogLink">Details</a><% end_if %></td>
		</tr>
	<% end_loop %>
	</tbody>
</table>
