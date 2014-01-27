 <div class="navbar-inner">
		<a class="brand" href="naut/projects">deploynaut<sup><small>&trade;</small></sup></a>
		<ul class="nav">
			<!-- <li><a href="naut/repository">repository</a></li> -->
			<!-- <li><a href="naut/environments">environments</a></li> -->
			<% if $CurrentProject %>
				<li><a href="naut/projects">projects</a></li>
				<li><a href="naut/project/$CurrentProject.Name/snapshots">snapshots</a></li>
			<% end_if %>
		</ul>
	 <% if CurrentUser %><ul class="nav pull-right"><li><a href="Security/logout">log out</a></li></ul><% end_if %>
</div>