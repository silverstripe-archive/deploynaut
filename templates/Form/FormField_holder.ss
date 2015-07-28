<div id="$Name" class="form-group field <% if $Message %>has-error<% end_if %> <% if $extraClass %>$extraClass<% end_if %>">
	<% if $Title %><label class="control-label" for="$ID">$Title</label><% end_if %>
	$Field

	<% if $Message %><p class="help-block">$Message</p><% end_if %>
	<% if $Description %><p class="help-block">$Description</p><% end_if %>
</div>
