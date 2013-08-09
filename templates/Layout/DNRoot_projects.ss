<h3>Projects</h3>
<table class="table-striped table table-bordered">
	<thead>
		<tr>
			<th>Project name</th>
		</tr>
	</thead>
	<tbody>
	<% if DNProjectList %>
	<% loop DNProjectList %>
		<tr>
			<td><a href="$Link">$Name</a></td>
		</tr>
	<% end_loop %>
	<% else %>
		<tr>
			<td>No projects available yet!</td>
		</tr>
	<% end_if %>
	</tbody>
</table>

