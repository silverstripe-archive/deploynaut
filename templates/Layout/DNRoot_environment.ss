<h3><a href="naut/project/$Project.Name">$Project.Name</a>:$Name</h3>
<% if URL %>
<h4><a href="$URL">$URL</a></h4>
<% end_if %>
<% if $CurrentBuild %>
<p>
	This environment is currently running build
	<span class="tooltip-hint" data-toggle="tooltip" title="$CurrentBuild.Message - $CurrentBuild.AuthorName" data-original-title="$CurrentBuild.Message">
		$CurrentBuild.Hash
	</span>
</p>
<% else %>
<p>New environment - deploy your first build.</p>
<% end_if %>
<% if HasMetrics %>
<p><a href="naut/project/$Project.Name/environment/$Name/metrics">See graphs for this environment</a></p>
<% end_if %>

<% if DeployForm %>
<h4>Deploy a new release</h4>
<p>Choose a release below and press the 'Deploy to $Name' button.</p>

<% with DeployForm %>
<form $FormAttributes class='form-inline'>
	<% loop VisibleFields %>$FieldHolder<% end_loop %>
	$Actions
	$HiddenFields
</form>
<% end_with %>
<% end_if %>

<h4>Deploy history</h4>
<p>Below builds have previous been deployed to this environment, ordered by deploy date descending.</p>
<table class="table-striped table table-bordered">
	<thead>
		<tr>
			<th>Date deployed</th>
			<th>Build</th>
			<th>Commit message</th>
			<th>Author</th>
		</tr>
	</thead>
	<tbody>
	<% loop DeployHistory %>
		<tr>
			<td>$DateTime.Rfc2822</td>
			<td>$BuildName</td>
			<td>$Message</td>
			<td>$AuthorName</td>
		</tr>
	<% end_loop %>
	</tbody>
</table>
