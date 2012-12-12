<article id="content" class="span12">
	<div class="container">
				<div class="pull-right">
					<% if RedisUnavailable %>
					<p class="text-error">Can't connect to redis: "$RedisUnavailable"</p>
					<% else %>
						<% if $RedisWorkersCount %>
						<p class="muted">$RedisWorkersCount worker(s) connected</p>
						<% else %>
						<p class="text-error">No workers connected</p>
						<% end_if %>
					<% end_if %>
				</div>
				<h3>Projects</h3>
			</div>
	
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

