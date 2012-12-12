<article id="content" class="span12">
	<h3>Environments</h3>
	<p></p>
	<table class="table-striped table table-bordered">
		<thead>
			<tr><th>Environment</th><th>Build currently deployed</th></tr>
		</thead>
		<tbody>
		<% control DNEnvironmentList %>
			<tr>
				<td><a href="$Link">$Name</a></td>
				<td>$CurrentBuild</td>
			</tr>
		<% end_control %>
		</tbody>
	</table>

	<h3>Builds</h3>
	<p></p>
	<table class="table-striped table table-bordered">
		<thead>
			<tr>
				<th>Build name</th>
				<th>Currently on</th>
				<th>Date for build creation</th>
			</tr>
		</thead>
		<tbody>
		<% loop DNBuildList %>
			<tr>
				<td>$Name</td>
				<td>
					<% control CurrentlyDeployedTo %>
					<a href="{$Link}">$Name</a><% if not $Last %>,<% end_if %>
					<% end_control %>
				</td>
				<td>$Created</td>
			</tr>
		<% end_loop %>
		</tbody>
	</table>
</article>

