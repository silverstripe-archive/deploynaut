 <div class="navbar-inner">
		<a class="brand" href="naut/projects">deploynaut<sup><small>&trade;</small></sup></a>
		<ul class="nav">
			<li<% if $CurrentProject %><% else %> class="active"<% end_if %>><a href="naut/projects">projects</a></li>
		</ul>
	 <% if CurrentUser %>
	 	<ul class="nav pull-right">
	 		<li><a href="Security/logout">log out</a></li>
	 	</ul>
	 <% end_if %>
</div>