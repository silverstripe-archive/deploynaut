<span class="icons">
	<% if $IsStarred %>
		<a class="tooltip-hint" data-toggle="tooltip" data-original-title="Unstar this project" href="$ToggleStarLink">
			<i class="icon-star"></i>
		</a>
	<% else %>
		<a class="tooltip-hint" data-toggle="tooltip" data-original-title="Star this project so it shows in the side navigation for quick access" href="$ToggleStarLink">
			<i class="icon-star hollow"></i>
		</a>
	<% end_if %>
	<% if $RunningEnvironmentCreations.count > 0 %>
		<span class="tooltip-hint" data-original-title="Environments are currently being built">
			<i class="fa fa-cog fa-spin"></i>
		</span>
	<% end_if %>
</span>
