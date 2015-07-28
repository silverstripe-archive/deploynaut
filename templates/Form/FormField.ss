<% if $isReadonly %>
	<input class="form-control" id="$ID" name="$Name" value="$Value" readonly/>
<% else %>
	<input class="form-control" $AttributesHTML />
<% end_if %>
