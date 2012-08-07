<article id="content" class="span12">
	<p>These are the environment that can be deployed to.
	<table class="table-striped table table-bordered">
		<thead>
			<tr><th>Environment</th><th>Build currently deployed</th></tr>
		</thead>
		<tbody>
		<% control DNEnvironments %>
			<tr>
				<td><a href="$Link">$Name</a></td>
				<td>$CurrentBuild</td>
			</tr>
		<% end_control %>
		</tbody>
	</table>
</article>