<a class="level1 nav-submenu<% if $IsActive %> open<% end_if %>" role="button" href="#collapseExample-$Pos" aria-controls="collapseExample-$Pos">
	<% if $Project.RunningEnvironmentCreations.count>0 %>
		<span class="plat-icon fa fa-cog fa-spin tooltip-hint" data-original-title="Environments are currently being built"></span>$Project.Name<span class="icon-arrow"></span>
	<% else %>
		<span class="plat-icon icon-stack"></span>$Project.Name<span class="icon-arrow"></span>
	<% end_if %>
</a>
