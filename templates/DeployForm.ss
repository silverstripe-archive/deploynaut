<form $FormAttributes class='form-inline deploy-form'>
	<% loop $VisibleFields %>
		$FieldHolder
	<% end_loop %>
	$HiddenFields
</form>
