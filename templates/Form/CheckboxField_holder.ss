<div id="$Name" class="checkbox <% if $Message %>has-error<% end_if %> <% if $extraClass %>$extraClass<% end_if %>">
	<label class="control-label">
		$Field
		$Title
	</label>

	<% if $Message %><p class="help-block">$Message</p><% end_if %>
	<% if $Description %><p class="help-block">$Description</p><% end_if %>
</div>
