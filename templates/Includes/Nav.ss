<li class="nav-main-heading">
	Stacks
	<% if $canCreateProjects %>
		<a href="naut/createstack" class="badge nav-add-stack">+</a>
	<% end_if %>
</li>

<% if not $DNProjectList %>
<li class="">
	<a>No stacks available.</a>
</li>
<% else %>
	<% loop $Navigation(5) %>
		<li class="active">

			<% include NavProjectLabel IsActive=$IsActive, Project=$Project, Pos=$Pos %>

			<ul class="collapse<% if $IsActive %> in<% end_if %>" id="collapseExample-$Pos">
				<% with $Project %>
					<li>
						<a role="button" href="$Link">Environments</a>
						<% if $IsProjectReady && $DNEnvironmentList %>
							<ul class="collapse in" >
							<% loop $DNEnvironmentList %>
								<li<% if $IsSection && $Up.ID == $Project.ID %> class="active"<% end_if %>>
									<a href="$Up.Link/environment/$Name">$Name</a>
								</li>
							<% end_loop %>
							</ul>
						<% end_if %>
					</li>
				<% end_with %>

				<% loop $Project.Menu %>
					<li<% if $IsSection %> class="active"<% end_if %>><a href="$Link">$Title</a></li>
				<% end_loop %>
			</ul>
		</li>
	<% end_loop %>

	<% if $DNProjectList.count > 5 || $StarredProjects.count > 0 %>
		<li class="">
			<a href="{$BaseHref}naut/projects">View all stacks&hellip;</a>
		</li>
	<% end_if %>
<% end_if %>

<% if $SupportLinks %>
	<li class="nav-main-heading">Support</li>

	<% loop $SupportLinks %>
		<li><a href="$URL" target="_blank"><span class="plat-icon $IconClass"></span>$Title</a></li>
	<% end_loop %>
<% end_if %>
