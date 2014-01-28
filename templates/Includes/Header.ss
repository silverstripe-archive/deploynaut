 <div class="navbar-inner">
		<a class="brand" href="naut/projects">deploynaut<sup><small>&trade;</small></sup></a>
		<ul class="nav">
			<% if $CurrentProject %>
				<li<% if ProjectOverview %> class="active"<% end_if %>><a href="naut/project/$CurrentProject.Name">overview</a></li>
				<li<% if SnapshotsSection %> class="active"<% end_if %>><a href="naut/project/$CurrentProject.Name/snapshots">snapshots</a></li>
			<% end_if %>
		</ul>
	 <% if CurrentUser %>
	 	<ul class="nav pull-right">
	 		<li<% if $CurrentProject %><% else %> class="active"<% end_if %>><a href="naut/projects">projects</a></li>
	 		<li class="divider-vertical"></li>
	 		<li><a href="Security/logout">log out</a></li>
	 	</ul>
	 <% end_if %>
</div>