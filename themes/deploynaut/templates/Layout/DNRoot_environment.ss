<article id="content">
	<div class="span12">
		<h3>$Project.Name:$Name</h3>
		<% if CurrentBuild %>
		<p><strong>$Project.Name:$Name</strong> is currently running build <strong>$CurrentBuild</strong>.</p>
		<% else %>
		<p>New environment - deploy your first build.</p>
		<% end_if %>
	</div>

	<div class="span12">
		<h4>Deploy a new release</h4>
		<p>Choose a build from the dropdown and press the deploy button.</p>
		
		<% with DeployForm %>
		<form $FormAttributes class='form-inline'>
			<% loop VisibleFields %>$Field<% end_loop %>
			$Actions
			$HiddenFields
		</form>
		<% end_with %>
	
	</div>

	<div class="span12">
		<h4>Deploy history</h4>
		<p>Below builds have previous been deployed to this environment, ordered by deploy date descending.</p>
		<table class="table-striped table table-bordered">
			<thead>
				<tr><th>Build</th><th>Date deployed</th></tr>
			</thead>
			<tbody>
			<% loop DeployHistory %>
				<tr>
					<td>$BuildName</td>
					<td>$DateTime.Rfc2822</td>
				</tr>
			<% end_loop %>
			</tbody>
		</table>
	</div>
	
</article>
