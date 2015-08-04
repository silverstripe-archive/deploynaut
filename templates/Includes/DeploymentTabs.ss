<ul class="nav nav-tabs">
	<li<% if $Overview %> class="active"<% end_if %>><a href="$CurrentProject.Link">Overview</a></li>

	<% with $CurrentProject %>
		<% if $DNEnvironmentList %>
			<% loop $DNEnvironmentList %>
				<li<% if $IsSection %> class="active"<% end_if %>><a href="$Link">$Name</a></li>
			<% end_loop %>
		<% end_if %>
	<% end_with %>
</ul>
