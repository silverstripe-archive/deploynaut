<article id="content" class="span12">
	<h1>Builds</h1>
	<p>This is a list of builds that exist on this server. They are created and transfered from our Team City CI servers <a href="http://teamcity.silverstripe.com/project.html?projectId=project8">AA Project</a></p>
	<table class="table-striped table table-bordered">
		<thead>
			<tr>
				<th>Build name</th>
				<th>Currently on</th>
				<th>Ever been live?</th>
				<th>Date for build creation</th>
			</tr>
		</thead>
		<tbody>
		<% loop DNBuilds %>
			<tr>
				<td>$Name</td>
				<td>
					<% control CurrentlyDeployedTo %>
					<a href="{$Link}">$Name</a><% if not $Last %>,<% end_if %>
					<% end_control %>
				</td>
				<td>
					<% if $EverDeployedTo(live) %>yes<% end_if %>
				</td>
				<td>$Created</td>
			</tr>
		<% end_loop %>
		</tbody>
	</table>
</article>