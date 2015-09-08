<% if $DNProjectList %>
	<li class="nav-main-heading">Stacks</li>
	<% loop $Navigation(5) %>
		<li class="active">
			<a class="nav-submenu<% if $IsActive %> open<% end_if %>" role="button" data-toggle="collapse" href="#collapseExample-$Pos" aria-controls="collapseExample-$Pos">
				<span class="plat-icon icon-stack"></span>$Project.Name<span class="icon-arrow"></span>
			</a>

			<ul class="collapse<% if $IsActive %> in<% end_if %>" id="collapseExample-$Pos">
				<% loop $Project.Menu %>
					<li<% if $IsSection %> class="active"<% end_if %>>
						<a href="$Link">$Title</a>
					</li>
				<% end_loop %>
			</ul>
		</li>
	<% end_loop %>

	<% if $DNProjectList.count > 5 %>
		<li class="">
			<a href="{$BaseHref}naut/projects">View more&hellip;</a>
		</li>
	<% end_if %>
<% end_if %>

<% if $SupportLinks %>
	<li class="nav-main-heading">Support</li>

	<% loop $SupportLinks %>
		<li><a href="$URL" target="_blank"><span class="plat-icon $IconClass"></span>$Title</a></li>
	<% end_loop %>
<% end_if %>
