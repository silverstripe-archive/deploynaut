<form $FormAttributes class='form-inline'>
	<% if $Message %>
		<p id="{$FormName}_error" class="alert alert-$MessageType">$Message</p>
	<% end_if %>
	<% loop VisibleFields %>$FieldHolder<% end_loop %>
	$Actions
	$HiddenFields
</form>
