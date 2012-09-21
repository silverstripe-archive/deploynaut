<article id="content" class="span12">
	<h1>Projects</h1>
	<p></p>
	<table class="table-striped table table-bordered">
		<thead>
			<tr>
				<th>Project name</th>
			</tr>
		</thead>
		<tbody>
		<% loop DNProjectList %>
			<tr>
				<td><a href='$Link'>$Name</a></td>
			</tr>
		<% end_loop %>
		</tbody>
	</table>
</article>

